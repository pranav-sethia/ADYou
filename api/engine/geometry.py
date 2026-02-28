"""
Geospatial helpers for the ADU Feasibility Engine.

All spatial math is performed in EPSG:2230 (NAD83 / California zone 6, US feet)
to guarantee accurate area and distance calculations for southern California.
"""

from shapely.geometry import Polygon, MultiPolygon, shape, mapping
from shapely.ops import unary_union
from pyproj import Transformer

# ---------------------------------------------------------------------------
# Coordinate transformers  (thread-safe, reusable singletons)
# ---------------------------------------------------------------------------

# WGS-84 (standard lat/lng)  →  California State Plane Zone 6 (US feet)
_TO_FEET = Transformer.from_crs("EPSG:4326", "EPSG:2230", always_xy=True)

# California State Plane Zone 6 (US feet)  →  WGS-84
_TO_WGS84 = Transformer.from_crs("EPSG:2230", "EPSG:4326", always_xy=True)


def geojson_to_shapely(geojson_geometry: dict) -> Polygon | MultiPolygon:
    """Convert a GeoJSON Geometry dict to a Shapely Polygon/MultiPolygon."""
    return shape(geojson_geometry)


def shapely_to_geojson(geom: Polygon | MultiPolygon) -> dict:
    """Convert a Shapely geometry back to a GeoJSON dict."""
    return mapping(geom)


def project_to_feet(polygon: Polygon | MultiPolygon) -> Polygon | MultiPolygon:
    """Re-project a WGS-84 polygon to EPSG:2230 (US feet)."""
    if isinstance(polygon, MultiPolygon):
        return MultiPolygon([project_to_feet(p) for p in polygon.geoms])

    projected_exterior = [
        _TO_FEET.transform(lng, lat) for lng, lat in polygon.exterior.coords
    ]
    projected_interiors = [
        [_TO_FEET.transform(lng, lat) for lng, lat in ring.coords]
        for ring in polygon.interiors
    ]
    return Polygon(projected_exterior, projected_interiors)


def project_to_wgs84(polygon: Polygon | MultiPolygon) -> Polygon | MultiPolygon:
    """Re-project an EPSG:2230 polygon back to WGS-84 (lat/lng)."""
    if isinstance(polygon, MultiPolygon):
        return MultiPolygon([project_to_wgs84(p) for p in polygon.geoms])

    projected_exterior = [
        _TO_WGS84.transform(x, y) for x, y in polygon.exterior.coords
    ]
    projected_interiors = [
        [_TO_WGS84.transform(x, y) for x, y in ring.coords]
        for ring in polygon.interiors
    ]
    return Polygon(projected_exterior, projected_interiors)


def calculate_area_sqft(polygon_wgs84: Polygon) -> float:
    """Return the area of *polygon_wgs84* in square feet (projected)."""
    projected = project_to_feet(polygon_wgs84)
    return projected.area


def compute_buildable_zone(
    property_wgs84: Polygon,
    setback_ft: float,
    obstacle_polygons_ft: list[Polygon],
) -> Polygon | MultiPolygon | None:
    """
    Compute the legal buildable zone within a property.

    1. Project property to feet.
    2. Apply inward setback buffer.
    3. Subtract all obstacle polygons.
    4. Project result back to WGS-84 for frontend rendering.

    Returns the buildable zone in WGS-84, or None if no area remains.
    """
    # Step 1: Project to feet
    prop_ft = project_to_feet(property_wgs84)

    # Step 2: Apply setback (shrink inward)
    safe_zone = prop_ft.buffer(-setback_ft)
    if safe_zone.is_empty:
        return None

    # Step 3: Subtract obstacles
    for obstacle in obstacle_polygons_ft:
        safe_zone = safe_zone.difference(obstacle)
        if safe_zone.is_empty:
            return None

    # Ensure valid geometry
    if not safe_zone.is_valid:
        safe_zone = safe_zone.buffer(0)

    # Step 4: Project back to WGS-84
    return project_to_wgs84(safe_zone)


def get_buildable_area_sqft(
    property_wgs84: Polygon,
    setback_ft: float,
    obstacle_polygons_ft: list[Polygon],
) -> float:
    """Calculate the area of the buildable zone in square feet."""
    prop_ft = project_to_feet(property_wgs84)

    safe_zone = prop_ft.buffer(-setback_ft)
    if safe_zone.is_empty:
        return 0.0

    for obstacle in obstacle_polygons_ft:
        safe_zone = safe_zone.difference(obstacle)
        if safe_zone.is_empty:
            return 0.0

    return safe_zone.area
