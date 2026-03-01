"""
Pydantic models for the ADU Feasibility Engine API.
"""

from typing import Optional
from pydantic import BaseModel, Field, model_validator


class RegisterRequest(BaseModel):
    email: str = Field(description="User's email address")
    password: str = Field(description="Plain text password")
    role: str = Field(default="buyer", description="Role: 'buyer' or 'seller'")
    name: str = Field(description="Full name of the user")

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatarUrl: str | None = None

class GeoJSONGeometry(BaseModel):
    """A minimal GeoJSON Geometry (Polygon or MultiPolygon)."""

    type: str = "Polygon"
    coordinates: list = Field(
        ...,
        description="Nested array of coordinate rings.",
    )


class AnalyzeRequest(BaseModel):
    """Payload for the /analyze endpoint.
    
    Either user_drawn_geojson OR (lat + lng) must be provided.
    If both are provided, user_drawn_geojson takes priority.
    """

    user_drawn_geojson: Optional[GeoJSONGeometry] = Field(
        default=None,
        description="The polygon drawn by the user defining their property/build area.",
    )
    lat: Optional[float] = Field(
        default=None,
        description="Latitude for auto-fetching parcel boundary via ReportAll.",
    )
    lng: Optional[float] = Field(
        default=None,
        description="Longitude for auto-fetching parcel boundary via ReportAll.",
    )
    location: str = Field(
        default="irvine_ca",
        description="Location key for zoning rules (e.g. 'irvine_ca').",
    )

    @model_validator(mode="after")
    def check_at_least_one_input(self):
        if not self.user_drawn_geojson and (self.lat is None or self.lng is None):
            raise ValueError(
                "Either 'user_drawn_geojson' or both 'lat' and 'lng' must be provided."
            )
        return self


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
    parcel_source: str = Field(
        default="manual",
        description="'reportall' if auto-fetched, 'manual' if user-drawn.",
    )
    apn: str | None = Field(
        default=None,
        description="Assessor Parcel Number from ReportAll (if available).",
    )
    parcel_address: str | None = Field(
        default=None,
        description="Site address from ReportAll (if available).",
    )
