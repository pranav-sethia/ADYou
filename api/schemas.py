"""
Pydantic models for the ADU Feasibility Engine API.
"""

from pydantic import BaseModel, Field


class GeoJSONGeometry(BaseModel):
    """A minimal GeoJSON Geometry (Polygon or MultiPolygon)."""

    type: str = "Polygon"
    coordinates: list = Field(
        ...,
        description="Nested array of coordinate rings.",
    )


class AnalyzeRequest(BaseModel):
    """Payload for the /analyze endpoint."""

    user_drawn_geojson: GeoJSONGeometry = Field(
        ..., description="The polygon drawn by the user defining their property/build area."
    )
    location: str = Field(
        default="irvine_ca",
        description="Location key for zoning rules (e.g. 'irvine_ca').",
    )


class DetectedObstacle(BaseModel):
    """A single detected obstacle with renderable geometry."""

    name: str
    area_sqft: float
    confidence: float
    geojson: GeoJSONGeometry


class AnalyzeResponse(BaseModel):
    """Full analysis result returned to the frontend."""

    is_valid: bool
    message: str
    property_geojson: GeoJSONGeometry = Field(
        ..., description="Parcel boundary polygon for rendering."
    )
    buildable_zone_geojson: GeoJSONGeometry | None = Field(
        default=None,
        description="Computed buildable zone polygon for rendering.",
    )
    obstacles: list[DetectedObstacle] = Field(
        default_factory=list,
        description="Detected obstacles with renderable GeoJSON.",
    )
    property_area_sqft: float
    buildable_area_sqft: float
    setback_ft: float
    max_adu_sqft: float
    est_cost_low: float | None = None
    est_cost_high: float | None = None
