"""
FastAPI application for the ADU Feasibility Engine.

Endpoint: POST /analyze
Accepts lat/lng coordinates, fetches the parcel boundary from Regrid,
detects obstacles via LangSAM, applies zoning setbacks, and returns
the full analysis with renderable GeoJSON layers.
"""

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    DetectedObstacle,
    GeoJSONGeometry,
)
from api.config.zoning_rules import get_zoning_rule
from engine.geometry import (
    shapely_to_geojson,
    project_to_feet,
    calculate_area_sqft,
    compute_buildable_zone,
    get_buildable_area_sqft,
)
from api.auth import router as auth_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ADU Feasibility Engine",
    version="1.0.0",
    description="Fully automated ADU feasibility analysis from lat/lng.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
from api.routers import rag
from financial_chatbot.router import router as financial_router
from api.routers.orchestrator import router as orchestrator_router

from api.routers.report import router as report_router

app.include_router(rag.router)
app.include_router(financial_router)
app.include_router(orchestrator_router)
app.include_router(report_router)

# Cost estimates
_COST_PER_SQFT_LOW = 200.0
_COST_PER_SQFT_HIGH = 400.0
# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_property(req: AnalyzeRequest) -> AnalyzeResponse:
    """
    Fully automated ADU feasibility analysis.

    Pipeline:
      1. Resolve parcel boundary (user-drawn OR auto-fetched from ReportAll).
      2. Detect obstacles via LangSAM.
      3. Apply zoning setbacks + subtract obstacles.
      4. Return renderable GeoJSON layers + stats.
    """

    # -- Resolve zoning rules ------------------------------------------------
    try:
        zoning = get_zoning_rule(req.location)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # -- Resolve parcel boundary ---------------------------------------------
    from shapely.geometry import shape

    parcel_source = "manual"
    parcel_apn = None
    parcel_address = None

    if req.user_drawn_geojson:
        # Mode 1: User drew a polygon manually
        logger.info("Using user-drawn property boundary.")
        try:
            geojson_dict = {
                "type": req.user_drawn_geojson.type,
                "coordinates": req.user_drawn_geojson.coordinates,
            }
            property_poly = shape(geojson_dict)
        except Exception as e:
            logger.error(f"Invalid GeoJSON: {e}")
            raise HTTPException(status_code=400, detail="Invalid GeoJSON boundary provided.")
    elif req.lat is not None and req.lng is not None:
        # Mode 2: Auto-fetch boundary from ReportAll
        logger.info(f"Auto-fetching parcel from ReportAll: lat={req.lat}, lng={req.lng}")
        from engine.parcel import fetch_parcel_by_coords

        parcel_data = fetch_parcel_by_coords(req.lat, req.lng)
        if parcel_data is None:
            raise HTTPException(
                status_code=404,
                detail="No parcel found at the given coordinates. Try drawing a boundary manually.",
            )
        property_poly = parcel_data.polygon
        parcel_source = "reportall"
        parcel_apn = parcel_data.apn
        parcel_address = parcel_data.address
    else:
        raise HTTPException(
            status_code=400,
            detail="Either 'user_drawn_geojson' or both 'lat' and 'lng' must be provided.",
        )

    if not property_poly.is_valid:
        property_poly = property_poly.buffer(0)

    # -- Calculate property area ---------------------------------------------
    property_area_sqft = calculate_area_sqft(property_poly)
    property_ft = project_to_feet(property_poly)

    # -- Compute buildable zone (Safe Zone) ----------------------------------
    setback = min(zoning.setback_side_ft, zoning.setback_rear_ft)
    obstacle_polygons_ft = []

    buildable_zone = compute_buildable_zone(
        property_poly, setback, obstacle_polygons_ft
    )
    buildable_area = get_buildable_area_sqft(
        property_poly, setback, obstacle_polygons_ft
    )

    obstacle_details = []

    # -- Build response GeoJSON layers ---------------------------------------
    property_geojson_raw = shapely_to_geojson(property_poly)
    property_geojson = GeoJSONGeometry(
        type=property_geojson_raw["type"],
        coordinates=property_geojson_raw["coordinates"],
    )

    # -- Determine validity --------------------------------------------------
    if buildable_zone is None or buildable_area < zoning.min_sqft:
        return AnalyzeResponse(
            is_valid=False,
            message=(
                f"Insufficient buildable area ({buildable_area:.0f} sq ft). "
                f"Minimum required: {zoning.min_sqft:.0f} sq ft after "
                f"{setback}-ft setbacks and obstacle clearance."
            ),
            property_geojson=property_geojson,
            buildable_zone_geojson=None,
            obstacles=obstacle_details,
            property_area_sqft=round(property_area_sqft, 1),
            buildable_area_sqft=round(buildable_area, 1),
            setback_ft=setback,
            max_adu_sqft=zoning.max_sqft_detached,
            parcel_source=parcel_source,
            apn=parcel_apn,
            parcel_address=parcel_address,
        )

    effective_buildable = min(buildable_area, zoning.max_sqft_detached)
    est_cost_low = round(effective_buildable * _COST_PER_SQFT_LOW, 2)
    est_cost_high = round(effective_buildable * _COST_PER_SQFT_HIGH, 2)

    zone_geojson_raw = shapely_to_geojson(buildable_zone)
    zone_geojson = GeoJSONGeometry(
        type=zone_geojson_raw["type"],
        coordinates=zone_geojson_raw["coordinates"],
    )

    return AnalyzeResponse(
        is_valid=True,
        message=(
            f"ADU eligible! {effective_buildable:,.0f} sq ft of buildable space. "
            f"Max ADU allowed: {zoning.max_sqft_detached:,.0f} sq ft."
        ),
        property_geojson=property_geojson,
        buildable_zone_geojson=zone_geojson,
        obstacles=obstacle_details,
        property_area_sqft=round(property_area_sqft, 1),
        buildable_area_sqft=round(effective_buildable, 1),
        setback_ft=setback,
        max_adu_sqft=zoning.max_sqft_detached,
        est_cost_low=est_cost_low,
        est_cost_high=est_cost_high,
        parcel_source=parcel_source,
        apn=parcel_apn,
        parcel_address=parcel_address,
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}
