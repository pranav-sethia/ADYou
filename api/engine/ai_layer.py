"""
Obstacle detection layer for the ADU Feasibility Engine.

Uses LangSAM (GroundingDINO + SAM) to detect structures from Mapbox
satellite imagery and convert segmentation masks to geo-referenced
Shapely polygons.
"""

import os
import io
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

import cv2
import numpy as np
import requests
import torch
from PIL import Image
from shapely.geometry import Polygon, MultiPolygon
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN", "")


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class DetectedObstacle:
    """A single obstacle with a name and WGS-84 polygon."""

    name: str
    polygon_wgs84: Polygon  # in WGS-84 for frontend rendering
    polygon_ft: Polygon     # in EPSG:2230 for area calculations
    confidence: float


# ---------------------------------------------------------------------------
# Abstract interface
# ---------------------------------------------------------------------------

class ObstacleDetector(ABC):
    """Base class — implement `detect` for each detection backend."""

    @abstractmethod
    def detect(
        self,
        parcel_polygon_wgs84: Polygon,
        parcel_polygon_ft: Polygon,
    ) -> list[DetectedObstacle]:
        """Detect obstacles within the given parcel."""
        ...


# ---------------------------------------------------------------------------
# Satellite tile fetcher
# ---------------------------------------------------------------------------

def fetch_satellite_tile(
    bbox: tuple[float, float, float, float],
    width: int = 640,
    height: int = 640,
) -> Image.Image:
    """
    Download a Mapbox satellite tile for the given bounding box.

    bbox: (min_lng, min_lat, max_lng, max_lat) in WGS-84.
    Returns a PIL Image.
    """
    if not MAPBOX_TOKEN:
        raise ValueError("MAPBOX_TOKEN is not set in .env")

    min_lng, min_lat, max_lng, max_lat = bbox
    bbox_str = f"[{min_lng},{min_lat},{max_lng},{max_lat}]"

    url = (
        f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/"
        f"{bbox_str}/{width}x{height}@2x"
        f"?access_token={MAPBOX_TOKEN}&attribution=false&logo=false"
    )

    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    return Image.open(io.BytesIO(resp.content)).convert("RGB")


# ---------------------------------------------------------------------------
# Mask → polygon conversion
# ---------------------------------------------------------------------------

def mask_to_polygon_pixels(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    """Convert a binary mask to a list of polygon contours in pixel coords."""
    mask_uint8 = (mask * 255).astype(np.uint8)
    contours, _ = cv2.findContours(
        mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    polygons = []
    for contour in contours:
        if contour.shape[0] >= 4:  # need at least 4 points for a polygon
            pts = contour.reshape(-1, 2).tolist()
            polygons.append([(x, y) for x, y in pts])
    return polygons


def pixel_coords_to_geo(
    pixel_polygons: list[list[tuple[int, int]]],
    bbox: tuple[float, float, float, float],
    img_width: int,
    img_height: int,
) -> list[Polygon]:
    """
    Convert pixel-coordinate polygons to WGS-84 polygons.

    Maps pixel (x, y) to (longitude, latitude) using the known bounding box.
    """
    min_lng, min_lat, max_lng, max_lat = bbox
    lng_range = max_lng - min_lng
    lat_range = max_lat - min_lat

    geo_polygons = []
    for pixel_poly in pixel_polygons:
        geo_coords = []
        for px, py in pixel_poly:
            lng = min_lng + (px / img_width) * lng_range
            # Y is inverted (pixel 0 is top = max_lat)
            lat = max_lat - (py / img_height) * lat_range
            geo_coords.append((lng, lat))
        if len(geo_coords) >= 4:
            geo_coords.append(geo_coords[0])  # close the ring
            try:
                poly = Polygon(geo_coords)
                if poly.is_valid and poly.area > 0:
                    geo_polygons.append(poly)
            except Exception:
                continue
    return geo_polygons


# ---------------------------------------------------------------------------
# LangSAM detector
# ---------------------------------------------------------------------------

class LangSAMObstacleDetector(ObstacleDetector):
    """
    Uses LangSAM (GroundingDINO + SAM-2) to detect structures
    from Mapbox satellite tiles and convert masks to geo-referenced polygons.

    Post-processing pipeline:
      1. Confidence filter (>= 0.5)
      2. Convert masks → geo polygons, clip to parcel
      3. Merge overlapping shapes per label (unary_union)
      4. Morphological closing (buffer out 3 ft, back in 3 ft) to fuse fragments
      5. Dilation (buffer out 3 ft) to fully encompass structures
      6. Minimum area filter (>= 50 sq ft)
    """

    # Post-processing constants
    MIN_AREA_SQFT = 50.0
    MORPHOLOGICAL_CLOSE_FT = 3.0  # fuse fragments
    DILATION_FT = 3.0             # expand to fully encompass

    def __init__(self):
        self._model = None
        # Determine device: MPS (Apple Silicon) > CUDA > CPU
        if torch.backends.mps.is_available():
            self._device = "mps"
        elif torch.cuda.is_available():
            self._device = "cuda"
        else:
            self._device = "cpu"
        logger.info(f"LangSAM will use device: {self._device}")

    def _load_model(self):
        """Lazy-load the LangSAM model on first use."""
        if self._model is None:
            from lang_sam import LangSAM
            logger.info("Loading LangSAM model (first time may download weights)...")
            self._model = LangSAM()
            logger.info("LangSAM model loaded.")

    def detect(
        self,
        parcel_polygon_wgs84: Polygon,
        parcel_polygon_ft: Polygon,
    ) -> list[DetectedObstacle]:
        """
        Detect obstacles within the parcel:
        1. Fetch satellite tile for the parcel bounding box.
        2. Run LangSAM with text prompts.
        3. Post-process: filter, merge, close, dilate.
        """
        from api.engine.geometry import project_to_feet
        from shapely.ops import unary_union

        self._load_model()

        # Get parcel bounding box with some padding
        bounds = parcel_polygon_wgs84.bounds  # (minx, miny, maxx, maxy)
        pad_lng = (bounds[2] - bounds[0]) * 0.15
        pad_lat = (bounds[3] - bounds[1]) * 0.15
        bbox = (
            bounds[0] - pad_lng,
            bounds[1] - pad_lat,
            bounds[2] + pad_lng,
            bounds[3] + pad_lat,
        )

        # Fetch satellite image
        img_width, img_height = 640, 640
        try:
            satellite_image = fetch_satellite_tile(bbox, img_width, img_height)
        except Exception as e:
            logger.error(f"Failed to fetch satellite tile: {e}")
            return []

        # The actual pixel dimensions might differ due to @2x
        actual_width, actual_height = satellite_image.size

        # Run LangSAM with expanded text prompts and per-label confidence thresholds
        prompts_config = [
            {
                "text_prompt": "house . building . shed . detached garage . roof",
                "label": "Structure",
                "min_confidence": 0.30,
            },
            {
                "text_prompt": "car . truck . vehicle",
                "label": "Vehicle",
                "min_confidence": 0.35,
            },
            {
                "text_prompt": "swimming pool",
                "label": "Swimming Pool",
                "min_confidence": 0.40,
            },
        ]

        # --- Step 1: Collect raw polygons per label ---
        # Dict: label -> list of (polygon_wgs84, confidence)
        raw_by_label: dict[str, list[tuple[Polygon, float]]] = {}

        for p_config in prompts_config:
            text_prompt = p_config["text_prompt"]
            label = p_config["label"]
            min_conf = p_config["min_confidence"]

            try:
                results = self._model.predict(
                    [satellite_image],
                    [text_prompt],
                )

                if not results:
                    continue

                result = results[0]
                masks = result.get("masks")
                scores = result.get("scores")

                if masks is None or len(masks) == 0:
                    continue

                for i, mask in enumerate(masks):
                    score = float(scores[i]) if scores is not None and i < len(scores) else 0.5

                    # Confidence filter
                    if score < min_conf:
                        continue

                    # Convert mask tensor to numpy
                    if torch.is_tensor(mask):
                        mask_np = mask.cpu().numpy()
                    else:
                        mask_np = np.array(mask)

                    # Handle multi-dim masks
                    if mask_np.ndim == 3:
                        mask_np = mask_np[0]

                    # Convert mask to pixel polygons
                    pixel_polys = mask_to_polygon_pixels(mask_np)

                    # Convert pixel polygons to geo polygons
                    geo_polys = pixel_coords_to_geo(
                        pixel_polys, bbox, actual_width, actual_height
                    )

                    for geo_poly in geo_polys:
                        # Clip to parcel boundary
                        clipped = geo_poly.intersection(parcel_polygon_wgs84)
                        if clipped.is_empty:
                            continue

                        if isinstance(clipped, MultiPolygon):
                            clipped = max(clipped.geoms, key=lambda g: g.area)

                        if not isinstance(clipped, Polygon) or clipped.area == 0:
                            continue

                        if label not in raw_by_label:
                            raw_by_label[label] = []
                        raw_by_label[label].append((clipped, score))

            except Exception as e:
                logger.warning(f"LangSAM detection failed for '{text_prompt}': {e}")
                continue

        # --- Step 2: Post-process per label ---
        obstacles: list[DetectedObstacle] = []

        for label, poly_score_pairs in raw_by_label.items():
            polys_wgs84 = [p for p, _ in poly_score_pairs]
            avg_confidence = sum(s for _, s in poly_score_pairs) / len(poly_score_pairs)

            logger.info(
                f"Post-processing '{label}': {len(polys_wgs84)} raw segments, "
                f"avg confidence {avg_confidence:.2f}"
            )

            # (a) Merge all overlapping polygons for this label
            merged = unary_union(polys_wgs84)

            # (b) Project to feet for morphological operations
            merged_ft = project_to_feet(merged)

            # (c) Morphological closing: expand then shrink to fuse fragments
            closed_ft = merged_ft.buffer(self.MORPHOLOGICAL_CLOSE_FT).buffer(
                -self.MORPHOLOGICAL_CLOSE_FT
            )

            # (d) Dilation: expand outward to fully encompass structures
            dilated_ft = closed_ft.buffer(self.DILATION_FT)

            # (e) Extract individual polygons from the result
            if isinstance(dilated_ft, MultiPolygon):
                final_polys_ft = list(dilated_ft.geoms)
            elif isinstance(dilated_ft, Polygon) and not dilated_ft.is_empty:
                final_polys_ft = [dilated_ft]
            else:
                continue

            for poly_ft in final_polys_ft:
                area_sqft = poly_ft.area

                # Minimum area filter
                if area_sqft < self.MIN_AREA_SQFT:
                    logger.info(
                        f"  Dropping '{label}' polygon: {area_sqft:.1f} sq ft "
                        f"< {self.MIN_AREA_SQFT} sq ft minimum"
                    )
                    continue

                # Project back to WGS-84 for frontend rendering
                from api.engine.geometry import project_to_wgs84
                poly_wgs84 = project_to_wgs84(poly_ft)

                # Clip to parcel boundary (dilation may have expanded beyond)
                poly_wgs84 = poly_wgs84.intersection(parcel_polygon_wgs84)
                if poly_wgs84.is_empty:
                    continue
                if isinstance(poly_wgs84, MultiPolygon):
                    poly_wgs84 = max(poly_wgs84.geoms, key=lambda g: g.area)
                if not isinstance(poly_wgs84, Polygon):
                    continue

                # Re-project clipped polygon to feet for accurate area
                poly_ft_final = project_to_feet(poly_wgs84)

                obstacles.append(DetectedObstacle(
                    name=label,
                    polygon_wgs84=poly_wgs84,
                    polygon_ft=poly_ft_final,
                    confidence=avg_confidence,
                ))

                logger.info(
                    f"  ✅ '{label}': {poly_ft_final.area:.0f} sq ft "
                    f"(confidence {avg_confidence:.2f})"
                )

        logger.info(f"Post-processing complete: {len(obstacles)} final obstacles.")
        return obstacles

