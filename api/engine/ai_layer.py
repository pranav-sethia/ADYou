"""
Obstacle detection layer for the ADU Feasibility Engine.

Uses LangSAM (GroundingDINO + SAM) to detect structures from Mapbox
satellite imagery and convert segmentation masks to geo-referenced
Shapely polygons.
"""

import os
import io
import math
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
EAGLEVIEW_API_KEY = os.getenv("EAGLEVIEW_API_KEY", "")


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
# Satellite tile fetcher (provider-agnostic, center-point approach)
# ---------------------------------------------------------------------------

# Tile sizes differ by provider:
#   Mapbox Static API uses 512px base tiles
#   EagleView Tile API uses 256px base tiles (standard Slippy Map)
MAPBOX_TILE_SIZE = 512
EAGLEVIEW_TILE_SIZE = 256


def _lng_lat_to_pixel(lng: float, lat: float, zoom: float, tile_size: int = 512) -> tuple[float, float]:
    """Convert WGS-84 lng/lat to Mercator pixel coords at the given zoom."""
    scale = tile_size * (2 ** zoom)
    x = (lng + 180.0) / 360.0 * scale
    lat_rad = math.radians(lat)
    y = (1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * scale
    return x, y


def _pixel_to_lng_lat(px: float, py: float, zoom: float, tile_size: int = 512) -> tuple[float, float]:
    """Convert Mercator pixel coords back to WGS-84 lng/lat."""
    scale = tile_size * (2 ** zoom)
    lng = px / scale * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1.0 - 2.0 * py / scale)))
    lat = math.degrees(lat_rad)
    return lng, lat


def _fetch_eagleview_tiles(
    center_lng: float,
    center_lat: float,
    zoom: int = 21,
    grid_size: int = 5,
) -> tuple[Image.Image, float, float, int]:
    """
    Fetch a grid of EagleView z/x/y tiles centered on a point and stitch them.

    EagleView WMTS supports high resolution tiles.
    A 5x5 grid of 256px tiles = 1280x1280 px composite image.

    Returns:
        (stitched_image, center_lng, center_lat, tile_size_used)
    """
    tile_size = EAGLEVIEW_TILE_SIZE
    # Find the tile containing the center point
    cx, cy = _lng_lat_to_pixel(center_lng, center_lat, zoom, tile_size)
    center_tile_x = int(cx // tile_size)
    center_tile_y = int(cy // tile_size)

    half = grid_size // 2
    composite_w = grid_size * tile_size
    composite_h = grid_size * tile_size
    composite = Image.new("RGB", (composite_w, composite_h))

    for dy in range(-half, half + 1):
        for dx in range(-half, half + 1):
            tx = center_tile_x + dx
            ty = center_tile_y + dy
            
            # Using the production endpoint with Latest layer.
            # WMTS generally uses standard slippy map endpoints for xyz tiles.
            url = (
                f"https://apis.eagleview.com/imagery/wmts/v2/visual/tile/Latest/GoogleMapsCompatible/{zoom}/{ty}/{tx}.jpeg"
                f"?apikey={EAGLEVIEW_API_KEY}"
            )
            try:
                resp = requests.get(url, timeout=15)
                resp.raise_for_status()
                tile_img = Image.open(io.BytesIO(resp.content)).convert("RGB")
            except Exception as e:
                logger.warning(f"EagleView tile fetch failed ({tx},{ty}): {e}")
                tile_img = Image.new("RGB", (tile_size, tile_size), (0, 0, 0))

            paste_x = (dx + half) * tile_size
            paste_y = (dy + half) * tile_size
            composite.paste(tile_img, (paste_x, paste_y))

    # The center of the composite image corresponds to the center of the center tile,
    # not exactly the user's center point. Compute the actual geographic center
    # of the composite for accurate inverse projection.
    composite_origin_px = (center_tile_x - half) * tile_size
    composite_origin_py = (center_tile_y - half) * tile_size
    composite_center_px = composite_origin_px + composite_w / 2.0
    composite_center_py = composite_origin_py + composite_h / 2.0
    actual_center_lng, actual_center_lat = _pixel_to_lng_lat(
        composite_center_px, composite_center_py, zoom, tile_size
    )

    logger.info(
        f"EagleView: stitched {grid_size}x{grid_size} tiles at zoom {zoom}, "
        f"composite size={composite.size}, "
        f"actual center=({actual_center_lng:.6f}, {actual_center_lat:.6f})"
    )
    return composite, actual_center_lng, actual_center_lat, tile_size


def _fetch_mapbox_static(
    center_lng: float,
    center_lat: float,
    zoom: float = 19.0,
    width: int = 640,
    height: int = 640,
) -> tuple[Image.Image, float, float, int]:
    """
    Fetch a Mapbox static satellite image centered on a point.

    Returns:
        (image, center_lng, center_lat, tile_size_used)
    """
    tile_size = MAPBOX_TILE_SIZE
    url = (
        f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/"
        f"{center_lng},{center_lat},{zoom},0/{width}x{height}@2x"
        f"?access_token={MAPBOX_TOKEN}&attribution=false&logo=false"
    )

    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    img = Image.open(io.BytesIO(resp.content)).convert("RGB")

    logger.info(
        f"Mapbox: fetched static image at zoom {zoom}, "
        f"image_size={img.size}, center=({center_lng:.6f}, {center_lat:.6f})"
    )
    return img, center_lng, center_lat, tile_size


def fetch_satellite_image(
    center_lng: float,
    center_lat: float,
) -> tuple[Image.Image, float, float, int, float]:
    """
    Auto-select the best available imagery provider.

    Priority: EagleView (higher resolution) > Mapbox (fallback).

    Returns:
        (image, actual_center_lng, actual_center_lat, tile_size, zoom)
    """
    if EAGLEVIEW_API_KEY:
        logger.info("Using EagleView high-resolution imagery provider.")
        zoom = 21  # EagleView supports high-res zoom levels
        img, clng, clat, ts = _fetch_eagleview_tiles(
            center_lng, center_lat, zoom=zoom, grid_size=5
        )
        return img, clng, clat, ts, float(zoom)

    if MAPBOX_TOKEN:
        logger.info("Using Mapbox satellite imagery provider (fallback).")
        zoom = 19.0
        img, clng, clat, ts = _fetch_mapbox_static(
            center_lng, center_lat, zoom=zoom
        )
        return img, clng, clat, ts, zoom

    raise ValueError("No imagery API key found. Set EAGLEVIEW_API_KEY or MAPBOX_TOKEN in .env")


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


def pixel_coords_to_geo_exact(
    pixel_polygons: list[list[tuple[int, int]]],
    center_lng: float,
    center_lat: float,
    zoom: float,
    img_width: int,
    img_height: int,
    tile_size: int = 512,
) -> list[Polygon]:
    """
    Convert pixel-coordinate polygons to WGS-84 polygons using exact
    spherical Mercator projection based on the image center.

    tile_size: 512 for Mapbox, 256 for EagleView/standard slippy tiles.
    """
    cx, cy = _lng_lat_to_pixel(center_lng, center_lat, zoom, tile_size)

    # For Mapbox @2x: physical pixels = 2 * logical pixels, so scale_factor = img_width / 640.
    # For EagleView stitched tiles: physical pixels = logical pixels, so scale_factor = 1.0.
    if tile_size == MAPBOX_TILE_SIZE:
        scale_factor = img_width / 640.0  # Mapbox @2x retina
    else:
        scale_factor = 1.0  # EagleView tiles are native resolution

    geo_polygons = []
    for pixel_poly in pixel_polygons:
        geo_coords = []
        for px, py in pixel_poly:
            # physical pixel offset from the center of the image
            offset_x = (px - img_width / 2.0) / scale_factor
            offset_y = (py - img_height / 2.0) / scale_factor

            lng, lat = _pixel_to_lng_lat(cx + offset_x, cy + offset_y, zoom, tile_size)
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
    MIN_AREA_SQFT = 25.0
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

        # Use the centroid of the user-drawn boundary as the image center.
        # Auto-select the best available imagery provider.
        centroid = parcel_polygon_wgs84.centroid
        center_lng, center_lat = centroid.x, centroid.y

        try:
            satellite_image, actual_clng, actual_clat, tile_size, zoom = fetch_satellite_image(
                center_lng, center_lat
            )
        except Exception as e:
            logger.error(f"Failed to fetch satellite imagery: {e}")
            return []

        # The actual pixel dimensions of the returned image
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

                    # Convert map coordinates using exact spherical Mercator
                    geo_polys = pixel_coords_to_geo_exact(
                        pixel_polys, actual_clng, actual_clat, zoom,
                        actual_width, actual_height, tile_size
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

