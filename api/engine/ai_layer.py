"""
Obstacle detection layer for the ADU Feasibility Engine.

Provides a pluggable interface so the mock detector can be swapped for
a real YOLOv8 / LangSAM inference pipeline later.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from shapely.geometry import Polygon
from shapely.affinity import translate

from api.engine.geometry import project_to_feet, calculate_overlap_pct


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class DetectedObstacle:
    """A single obstacle with a name and projected (EPSG:2230) polygon."""

    name: str
    polygon_ft: Polygon  # already in feet


# ---------------------------------------------------------------------------
# Abstract interface
# ---------------------------------------------------------------------------

class ObstacleDetector(ABC):
    """Base class – implement `get_obstacles` for each detection backend."""

    @abstractmethod
    def get_obstacles(
        self,
        property_polygon_ft: Polygon,
    ) -> list[DetectedObstacle]:
        """
        Return a list of obstacles that exist within the property.

        Parameters
        ----------
        property_polygon_ft : Polygon
            The property boundary already projected to EPSG:2230.
        """
        ...


# ---------------------------------------------------------------------------
# Mock implementation  (hackathon MVP)
# ---------------------------------------------------------------------------

class MockObstacleDetector(ObstacleDetector):
    """
    Generates deterministic "virtual" obstacles relative to the property
    centroid so the UI/validation pipeline can be tested end-to-end
    without a real CV model.

    Obstacles are:
    • A **Swimming Pool** – 20×10 ft rectangle offset to the south-east.
    • A **Large Oak Tree** – ~8 ft diameter circle offset to the north-west.
    """

    def get_obstacles(
        self,
        property_polygon_ft: Polygon,
    ) -> list[DetectedObstacle]:
        cx, cy = property_polygon_ft.centroid.coords[0]

        # Pool: 20 ft × 10 ft, offset +15 ft east, −20 ft south from centroid
        pool = Polygon([
            (cx + 5, cy - 25),
            (cx + 25, cy - 25),
            (cx + 25, cy - 15),
            (cx + 5, cy - 15),
        ])

        # Tree canopy: approximate 8-ft diameter circle at −12 ft west, +15 ft north
        tree_center_x = cx - 12
        tree_center_y = cy + 15
        tree = Polygon([
            (tree_center_x - 4, tree_center_y),
            (tree_center_x - 2.8, tree_center_y - 2.8),
            (tree_center_x, tree_center_y - 4),
            (tree_center_x + 2.8, tree_center_y - 2.8),
            (tree_center_x + 4, tree_center_y),
            (tree_center_x + 2.8, tree_center_y + 2.8),
            (tree_center_x, tree_center_y + 4),
            (tree_center_x - 2.8, tree_center_y + 2.8),
        ])

        return [
            DetectedObstacle(name="Swimming Pool", polygon_ft=pool),
            DetectedObstacle(name="Large Oak Tree", polygon_ft=tree),
        ]


# ---------------------------------------------------------------------------
# Future: Real YOLOv8 detector stub
# ---------------------------------------------------------------------------
# class YoloObstacleDetector(ObstacleDetector):
#     """
#     Runs Ultralytics YOLOv8 on a satellite tile and converts the
#     bounding boxes to Shapely polygons in EPSG:2230.
#     """
#
#     def __init__(self, model_path: str = "yolov8n.pt"):
#         from ultralytics import YOLO
#         self.model = YOLO(model_path)
#
#     def get_obstacles(self, property_polygon_ft: Polygon) -> list[DetectedObstacle]:
#         # 1. Fetch satellite tile for the bounding box of the property.
#         # 2. Run inference: results = self.model.predict(tile_image)
#         # 3. Convert pixel bboxes → geo coords → EPSG:2230 polygons.
#         # 4. Return [DetectedObstacle(name=cls, polygon_ft=poly), ...]
#         raise NotImplementedError


def check_obstacles(
    adu_polygon_ft: Polygon,
    obstacles: list[DetectedObstacle],
    overlap_threshold_pct: float = 10.0,
) -> list[dict]:
    """
    Return details for every obstacle whose overlap with the ADU exceeds
    *overlap_threshold_pct*.
    """
    conflicts: list[dict] = []
    for obs in obstacles:
        pct = calculate_overlap_pct(adu_polygon_ft, obs.polygon_ft)
        if pct >= overlap_threshold_pct:
            conflicts.append({"name": obs.name, "overlap_pct": round(pct, 1)})
    return conflicts
