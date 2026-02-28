"""
FastAPI application for the ADU Feasibility Engine.

Endpoint: POST /validate-placement
Accepts property boundary + ADU footprint as GeoJSON, runs three validation
checks (size, setback, obstacles), and returns a structured response.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import (
    ValidationRequest,
    ValidationResponse,
    ObstacleDetail,
)
from api.config.zoning_rules import get_zoning_rule
from api.engine.geometry import (
    geojson_to_shapely,
    project_to_feet,
    calculate_area_sqft,
    check_setback,
)
from api.engine.ai_layer import (
    MockObstacleDetector,
    check_obstacles,
)

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ADU Feasibility Engine",
    version="0.1.0",
    description="Validates proposed ADU placements against zoning rules and obstacles.",
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

# Rough cost per sqft for estimation (Irvine average ADU cost)
_COST_PER_SQFT = 300.0


# ---------------------------------------------------------------------------
# Validation endpoint
# ---------------------------------------------------------------------------

@app.post("/validate-placement", response_model=ValidationResponse)
async def validate_placement(req: ValidationRequest) -> ValidationResponse:
    """
    Run the three-stage validation pipeline:
      1. Size check  (area must be within zoning min/max)
      2. Setback check  (ADU must be inside buffered property)
      3. Obstacle check  (ADU must not overlap mock obstacles > threshold)
    """

    # -- Resolve zoning rules for the requested location -----------------
    try:
        zoning = get_zoning_rule(req.location)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # -- Convert GeoJSON to Shapely polygons -----------------------------
    property_poly = geojson_to_shapely(req.property_boundary.model_dump())
    adu_poly = geojson_to_shapely(req.adu_box.model_dump())

    if not property_poly.is_valid or not adu_poly.is_valid:
        raise HTTPException(
            status_code=422,
            detail="Invalid polygon geometry. Ensure rings are closed and non-self-intersecting.",
        )

    violations: list[str] = []

    # -- CHECK 1: Size ---------------------------------------------------
    area_sqft = calculate_area_sqft(adu_poly)

    if area_sqft < zoning.min_sqft:
        violations.append(
            f"ADU is too small ({area_sqft:.0f} sq ft). "
            f"Minimum is {zoning.min_sqft:.0f} sq ft."
        )
    elif area_sqft > zoning.max_sqft_detached:
        violations.append(
            f"ADU is too large ({area_sqft:.0f} sq ft). "
            f"Maximum for a detached ADU is {zoning.max_sqft_detached:.0f} sq ft."
        )

    # -- CHECK 2: Setback ------------------------------------------------
    # Use the smaller of side/rear setback as a uniform buffer for MVP.
    setback = min(zoning.setback_side_ft, zoning.setback_rear_ft)
    setback_ok, setback_msg = check_setback(property_poly, adu_poly, setback)
    if not setback_ok:
        violations.append(setback_msg)

    # -- CHECK 3: Obstacles (AI layer) -----------------------------------
    property_ft = project_to_feet(property_poly)
    adu_ft = project_to_feet(adu_poly)

    detected_obstacles = _detector.get_obstacles(property_ft)
    obstacle_conflicts = check_obstacles(adu_ft, detected_obstacles)

    obstacle_details: list[ObstacleDetail] = []
    for conflict in obstacle_conflicts:
        violations.append(
            f"Obstacle detected: {conflict['name']} "
            f"({conflict['overlap_pct']:.1f}% overlap with ADU)."
        )
        obstacle_details.append(
            ObstacleDetail(
                name=conflict["name"],
                overlap_pct=conflict["overlap_pct"],
            )
        )

    # -- Build response --------------------------------------------------
    is_valid = len(violations) == 0
    est_cost = round(area_sqft * _COST_PER_SQFT, 2) if is_valid else None

    if is_valid:
        message = f"Valid placement! Estimated cost: ${est_cost:,.0f}"
    else:
        message = "; ".join(violations)

    return ValidationResponse(
        is_valid=is_valid,
        message=message,
        area_sqft=round(area_sqft, 1),
        est_cost=est_cost,
        violations=violations,
        obstacles=obstacle_details,
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}
