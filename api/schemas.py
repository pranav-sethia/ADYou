"""
Pydantic models defining the API request/response contract for /validate-placement.
"""

from pydantic import BaseModel, Field


class GeoJSONGeometry(BaseModel):
    """A minimal GeoJSON Geometry (Polygon)."""

    type: str = "Polygon"
    coordinates: list[list[list[float]]] = Field(
        ...,
        description=(
            "Nested array of coordinate rings. "
            "Each coordinate is [longitude, latitude]."
        ),
    )


class ValidationRequest(BaseModel):
    """Payload sent from the frontend after both polygons are drawn."""

    property_boundary: GeoJSONGeometry = Field(
        ..., description="GeoJSON Polygon of the user's property boundary."
    )
    adu_box: GeoJSONGeometry = Field(
        ..., description="GeoJSON Polygon of the proposed ADU footprint."
    )
    location: str = Field(
        default="irvine_ca",
        description="Location key used to look up zoning rules (e.g. 'irvine_ca').",
    )


class ObstacleDetail(BaseModel):
    """Information about a single detected obstacle."""

    name: str
    overlap_pct: float = Field(
        ..., description="Percentage of the ADU area overlapping this obstacle."
    )


class ValidationResponse(BaseModel):
    """Result returned to the frontend."""

    is_valid: bool
    message: str
    area_sqft: float = Field(
        ..., description="Calculated area of the ADU in square feet."
    )
    est_cost: float | None = Field(
        default=None, description="Rough cost estimate in USD (if valid)."
    )
    violations: list[str] = Field(
        default_factory=list,
        description="Human-readable list of all rule violations.",
    )
    obstacles: list[ObstacleDetail] = Field(
        default_factory=list,
        description="Details about any intersecting obstacles.",
    )
