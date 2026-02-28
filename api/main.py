"""
FastAPI application for the ADU Feasibility Engine.

Endpoint: POST /validate-placement
Accepts a property boundary as GeoJSON, computes the legal buildable zone
by applying zoning setbacks and subtracting obstacles, and returns the
result with a renderable GeoJSON polygon.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import (
    ValidationRequest,
    ValidationResponse,
    ObstacleDetail,
    GeoJSONGeometry,
)
from api.config.zoning_rules import get_zoning_rule
from api.engine.geometry import (
    geojson_to_shapely,
    shapely_to_geojson,
    project_to_feet,
    calculate_area_sqft,
    compute_buildable_zone,
    get_buildable_area_sqft,
)
from api.engine.ai_layer import MockObstacleDetector

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ADU Feasibility Engine",
    version="0.2.0",
    description="Computes legal ADU buildable zones from property boundaries.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton detector – swap MockObstacleDetector for YoloObstacleDetector later
_detector = MockObstacleDetector()

# Cost per sqft range for estimation (Irvine average ADU cost)
_COST_PER_SQFT_LOW = 200.0
_COST_PER_SQFT_HIGH = 400.0


# ---------------------------------------------------------------------------
# Validation endpoint
# ---------------------------------------------------------------------------

@app.post("/validate-placement", response_model=ValidationResponse)
async def validate_placement(req: ValidationRequest) -> ValidationResponse:
    """
    Compute the legal buildable zone for an ADU on the given property.

    Pipeline:
      1. Project property to EPSG:2230 (feet).
      2. Apply zoning setback (inward buffer).
      3. Detect and subtract obstacles (house, pool, trees).
      4. Return the remaining buildable zone as GeoJSON.
    """

    # -- Resolve zoning rules for the requested location -----------------
    try:
        zoning = get_zoning_rule(req.location)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # -- Convert GeoJSON to Shapely polygon ------------------------------
    property_poly = geojson_to_shapely(req.property_boundary.model_dump())

    if not property_poly.is_valid:
        raise HTTPException(
            status_code=422,
            detail="Invalid polygon geometry. Ensure rings are closed and non-self-intersecting.",
        )

    # -- Calculate property area -----------------------------------------
    property_area_sqft = calculate_area_sqft(property_poly)

    # -- Detect obstacles (disabled for now — re-enable later) ------------
    # property_ft = project_to_feet(property_poly)
    # detected_obstacles = _detector.get_obstacles(property_ft)
    # obstacle_polygons_ft = [obs.polygon_ft for obs in detected_obstacles]
    obstacle_polygons_ft: list = []

    # -- Compute buildable zone ------------------------------------------
    setback = min(zoning.setback_side_ft, zoning.setback_rear_ft)

    buildable_zone = compute_buildable_zone(
        property_poly, setback, obstacle_polygons_ft
    )

    buildable_area = get_buildable_area_sqft(
        property_poly, setback, obstacle_polygons_ft
    )

    # -- Build obstacle details ------------------------------------------
    obstacle_details: list = []

    # -- Determine validity ----------------------------------------------
    if buildable_zone is None or buildable_area < zoning.min_sqft:
        return ValidationResponse(
            is_valid=False,
            message=(
                f"Insufficient buildable area ({buildable_area:.0f} sq ft). "
                f"Minimum required: {zoning.min_sqft:.0f} sq ft after "
                f"{setback}-ft setbacks and obstacle clearance."
            ),
            property_area_sqft=round(property_area_sqft, 1),
            buildable_area_sqft=round(buildable_area, 1),
            setback_ft=setback,
            max_adu_sqft=zoning.max_sqft_detached,
            obstacles=obstacle_details,
            buildable_zone_geojson=None,
        )

    # Cap buildable area display at zoning max
    effective_buildable = min(buildable_area, zoning.max_sqft_detached)

    est_cost_low = round(effective_buildable * _COST_PER_SQFT_LOW, 2)
    est_cost_high = round(effective_buildable * _COST_PER_SQFT_HIGH, 2)

    # Convert buildable zone to GeoJSON for frontend rendering
    zone_geojson_raw = shapely_to_geojson(buildable_zone)
    zone_geojson = GeoJSONGeometry(
        type=zone_geojson_raw["type"],
        coordinates=zone_geojson_raw["coordinates"],
    )

    return ValidationResponse(
        is_valid=True,
        message=(
            f"You have {effective_buildable:,.0f} sq ft of buildable space! "
            f"Max ADU allowed: {zoning.max_sqft_detached:,.0f} sq ft."
        ),
        property_area_sqft=round(property_area_sqft, 1),
        buildable_area_sqft=round(effective_buildable, 1),
        setback_ft=setback,
        max_adu_sqft=zoning.max_sqft_detached,
        est_cost_low=est_cost_low,
        est_cost_high=est_cost_high,
        obstacles=obstacle_details,
        buildable_zone_geojson=zone_geojson,
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}
