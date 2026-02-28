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
from api.engine.geometry import (
    shapely_to_geojson,
    project_to_feet,
    calculate_area_sqft,
    compute_buildable_zone,
    get_buildable_area_sqft,
)
from api.engine.ai_layer import LangSAMObstacleDetector

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

# Lazy-loaded detector (heavy model, load on first request)
_detector: LangSAMObstacleDetector | None = None

# Cost estimates
_COST_PER_SQFT_LOW = 200.0
_COST_PER_SQFT_HIGH = 400.0


def get_detector() -> LangSAMObstacleDetector:
    """Get or create the singleton obstacle detector."""
    global _detector
    if _detector is None:
        _detector = LangSAMObstacleDetector()
    return _detector


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_property(req: AnalyzeRequest) -> AnalyzeResponse:
    """
    Fully automated ADU feasibility analysis.

    Pipeline:
      1. Fetch parcel boundary from Regrid API.
      2. Detect obstacles via LangSAM.
      3. Apply zoning setbacks + subtract obstacles.
      4. Return renderable GeoJSON layers + stats.
    """

    # -- Resolve zoning rules ------------------------------------------------
    try:
        zoning = get_zoning_rule(req.location)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # -- Parse user-drawn boundary -------------------------------------------
    logger.info("Parsing user-drawn property boundary...")
    from shapely.geometry import shape
    try:
        # Convert Pydantic GeoJSONGeometry to a dict for Shapely
        geojson_dict = {
            "type": req.user_drawn_geojson.type,
            "coordinates": req.user_drawn_geojson.coordinates
        }
        property_poly = shape(geojson_dict)
    except Exception as e:
        logger.error(f"Invalid GeoJSON: {e}")
        raise HTTPException(status_code=400, detail="Invalid GeoJSON boundary provided.")
        
    if not property_poly.is_valid:
        property_poly = property_poly.buffer(0)

    # -- Calculate property area ---------------------------------------------
    property_area_sqft = calculate_area_sqft(property_poly)
    property_ft = project_to_feet(property_poly)

    # -- Detect obstacles via LangSAM ----------------------------------------
    logger.info("Running LangSAM obstacle detection inside user boundary...")
    try:
        detector = get_detector()
        detected_obstacles = detector.detect(property_poly, property_ft)
        logger.info(f"Detected {len(detected_obstacles)} obstacles.")
    except Exception as e:
        logger.warning(f"Obstacle detection failed: {e}. Continuing without obstacles.")
        detected_obstacles = []

    obstacle_polygons_ft = [obs.polygon_ft for obs in detected_obstacles]

    # -- Compute buildable zone ----------------------------------------------
    setback = min(zoning.setback_side_ft, zoning.setback_rear_ft)

    buildable_zone = compute_buildable_zone(
        property_poly, setback, obstacle_polygons_ft
    )
    buildable_area = get_buildable_area_sqft(
        property_poly, setback, obstacle_polygons_ft
    )

    # -- Build obstacle details for response ---------------------------------
    obstacle_details = []
    for obs in detected_obstacles:
        obs_geojson_raw = shapely_to_geojson(obs.polygon_wgs84)
        obstacle_details.append(DetectedObstacle(
            name=obs.name,
            area_sqft=round(obs.polygon_ft.area, 1),
            confidence=round(obs.confidence, 2),
            geojson=GeoJSONGeometry(
                type=obs_geojson_raw["type"],
                coordinates=obs_geojson_raw["coordinates"],
            ),
        ))

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
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}
