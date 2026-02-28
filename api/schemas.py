"""
Pydantic models defining the API request/response contract for /validate-placement.
"""

from pydantic import BaseModel, Field


class GeoJSONGeometry(BaseModel):
    """A minimal GeoJSON Geometry (Polygon or MultiPolygon)."""

    type: str = "Polygon"
    coordinates: list = Field(
        ...,
        description=(
            "Nested array of coordinate rings. "
            "Each coordinate is [longitude, latitude]."
        ),
    )


class ValidationRequest(BaseModel):
    """Payload sent from the frontend after the property polygon is drawn."""

    property_boundary: GeoJSONGeometry = Field(
        ..., description="GeoJSON Polygon of the user's property boundary."
    )
    location: str = Field(
        default="irvine_ca",
        description="Location key used to look up zoning rules (e.g. 'irvine_ca').",
    )


class ObstacleDetail(BaseModel):
    """Information about a single detected obstacle."""

    name: str
    area_sqft: float = Field(
        ..., description="Area of the obstacle in square feet."
    )


class ValidationResponse(BaseModel):
    """Result returned to the frontend."""

    is_valid: bool
    message: str
    property_area_sqft: float = Field(
        ..., description="Total property area in square feet."
    )
    buildable_area_sqft: float = Field(
        ..., description="Remaining buildable area after setbacks and obstacles."
    )
    setback_ft: float = Field(
        ..., description="Setback applied in feet."
    )
    max_adu_sqft: float = Field(
        ..., description="Maximum ADU size allowed by zoning."
    )
    est_cost_low: float | None = Field(
        default=None, description="Low-end cost estimate in USD."
    )
    est_cost_high: float | None = Field(
        default=None, description="High-end cost estimate in USD."
    )
    obstacles: list[ObstacleDetail] = Field(
        default_factory=list,
        description="Obstacles detected within the property.",
    )
    buildable_zone_geojson: GeoJSONGeometry | None = Field(
        default=None,
        description="GeoJSON of the computed buildable zone for rendering on the map.",
    )
