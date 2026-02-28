"""
Obstacle detection layer for the ADU Feasibility Engine.

Provides a pluggable interface so the mock detector can be swapped for
a real YOLOv8 / LangSAM inference pipeline later.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from shapely.geometry import Polygon


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
    • A **Primary Residence** – 40×30 ft rectangle centered on the lot.
    • A **Swimming Pool** – 20×10 ft rectangle offset to the south-east.
    • A **Large Oak Tree** – ~8 ft diameter circle offset to the north-west.
    """

    def get_obstacles(
        self,
        property_polygon_ft: Polygon,
    ) -> list[DetectedObstacle]:
        cx, cy = property_polygon_ft.centroid.coords[0]

        # Primary Residence: 40 ft × 30 ft, centered on the lot
        house = Polygon([
            (cx - 20, cy - 15),
            (cx + 20, cy - 15),
            (cx + 20, cy + 15),
            (cx - 20, cy + 15),
        ])

        # Pool: 20 ft × 10 ft, offset +25 ft east, −25 ft south from centroid
        pool = Polygon([
            (cx + 15, cy - 30),
            (cx + 35, cy - 30),
            (cx + 35, cy - 20),
            (cx + 15, cy - 20),
        ])

        # Tree canopy: approximate 8-ft diameter circle at −20 ft west, +20 ft north
        tree_center_x = cx - 20
        tree_center_y = cy + 20
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
            DetectedObstacle(name="Primary Residence", polygon_ft=house),
            DetectedObstacle(name="Swimming Pool", polygon_ft=pool),
            DetectedObstacle(name="Large Oak Tree", polygon_ft=tree),
        ]


# ---------------------------------------------------------------------------
# Future: Real YOLOv8 detector stub
# ---------------------------------------------------------------------------
# class YoloObstacleDetector(ObstacleDetector):
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
