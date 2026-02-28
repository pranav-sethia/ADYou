"""
Geospatial helpers for the ADU Feasibility Engine.

All spatial math is performed in EPSG:2230 (NAD83 / California zone 6, US feet)
to guarantee accurate area and distance calculations for southern California.
"""

from shapely.geometry import Polygon, shape
from pyproj import Transformer

# ---------------------------------------------------------------------------
# Coordinate transformers  (thread-safe, reusable singletons)
# ---------------------------------------------------------------------------

# WGS-84 (standard lat/lng)  →  California State Plane Zone 6 (US feet)
_TO_FEET = Transformer.from_crs("EPSG:4326", "EPSG:2230", always_xy=True)

# California State Plane Zone 6 (US feet)  →  WGS-84
_TO_WGS84 = Transformer.from_crs("EPSG:2230", "EPSG:4326", always_xy=True)


def geojson_to_shapely(geojson_geometry: dict) -> Polygon:
    """Convert a GeoJSON Geometry dict to a Shapely Polygon."""
    return shape(geojson_geometry)


def project_to_feet(polygon: Polygon) -> Polygon:
    """Re-project a WGS-84 polygon to EPSG:2230 (US feet)."""
    projected_coords: list[tuple[float, float]] = []
    for lng, lat in polygon.exterior.coords:
        x, y = _TO_FEET.transform(lng, lat)
        projected_coords.append((x, y))
    return Polygon(projected_coords)


def calculate_area_sqft(polygon_wgs84: Polygon) -> float:
    """Return the area of *polygon_wgs84* in square feet (projected)."""
    projected = project_to_feet(polygon_wgs84)
    return projected.area


def check_setback(
    property_wgs84: Polygon,
    adu_wgs84: Polygon,
    setback_ft: float,
) -> tuple[bool, str]:
    """
    Check that *adu_wgs84* lies fully within the property boundary
    after applying an internal buffer of *setback_ft*.

    Returns (passes, message).
    """
    prop_ft = project_to_feet(property_wgs84)
    adu_ft = project_to_feet(adu_wgs84)

    safe_zone = prop_ft.buffer(-setback_ft)
    if safe_zone.is_empty:
        return False, (
            f"Property is too small for a {setback_ft}-ft setback; "
            "no buildable area remains."
        )

    if safe_zone.contains(adu_ft):
        return True, "ADU is within the required setback zone."

    return False, (
        f"ADU violates the {setback_ft}-ft setback from the property line."
    )


def calculate_overlap_pct(poly_a: Polygon, poly_b: Polygon) -> float:
    """
    Return the percentage of *poly_a*'s area that overlaps with *poly_b*.
    Both polygons must already be in the same CRS (EPSG:2230).
    """
    if not poly_a.intersects(poly_b):
        return 0.0
    intersection_area = poly_a.intersection(poly_b).area
    return (intersection_area / poly_a.area) * 100.0 if poly_a.area > 0 else 0.0
