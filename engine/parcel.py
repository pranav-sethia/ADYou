"""
ReportAll API integration for fetching parcel boundaries by coordinates.

Uses the ReportAll USA Parcel API to retrieve the parcel polygon (in WKT)
that contains the given latitude/longitude point, and converts it to a
Shapely geometry for downstream analysis.
"""

import logging
import os
from dataclasses import dataclass

import requests
from dotenv import load_dotenv
from shapely import wkt
from shapely.geometry import Polygon, MultiPolygon

logger = logging.getLogger(__name__)

load_dotenv()
REPORTALL_API_KEY = os.getenv("REPORTALL_API_KEY", "")

REPORTALL_BASE_URL = "https://reportallusa.com/api/parcels.php"


@dataclass
class ParcelData:
    """Parsed parcel information from ReportAll."""

    polygon: Polygon | MultiPolygon  # WGS-84 geometry
    apn: str | None = None
    acreage: float | None = None
    owner: str | None = None
    address: str | None = None
    raw: dict | None = None  # Full API response for debugging


def fetch_parcel_by_coords(lat: float, lng: float) -> ParcelData | None:
    """
    Fetch the parcel polygon that contains the given lat/lng point.

    Returns:
        ParcelData with the Shapely polygon and metadata, or None if not found.
    """
    if not REPORTALL_API_KEY:
        raise ValueError("REPORTALL_API_KEY is not set in .env")

    params = {
        "client": REPORTALL_API_KEY,
        "spatial_intersect": f"POINT({lng} {lat})",
        "si_srid": 4326,
        "v": 4,
    }

    logger.info(f"Fetching parcel from ReportAll: lat={lat}, lng={lng}")

    try:
        resp = requests.get(REPORTALL_BASE_URL, params=params, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        logger.error(f"ReportAll API request failed: {e}")
        return None

    data = resp.json()

    # Check for a valid response
    if data.get("status") != "OK" or not data.get("results"):
        logger.warning(f"ReportAll failed or returned no results. Payload: {data}")
        return None

    # Take the first (closest) result
    parcel = data["results"][0]

    # Parse the WKT geometry
    geom_wkt = parcel.get("geom_as_wkt")
    if not geom_wkt:
        logger.warning("ReportAll parcel has no geometry (geom_as_wkt missing)")
        return None

    try:
        geometry = wkt.loads(geom_wkt)
    except Exception as e:
        logger.error(f"Failed to parse WKT geometry: {e}")
        return None

    # If it's a MultiPolygon, take the largest polygon
    if isinstance(geometry, MultiPolygon):
        geometry = max(geometry.geoms, key=lambda g: g.area)

    if not geometry.is_valid:
        geometry = geometry.buffer(0)

    logger.info(
        f"ReportAll parcel found: APN={parcel.get('apn')}, "
        f"acreage={parcel.get('calculated_acreage')}, "
        f"geometry type={geometry.geom_type}"
    )

    return ParcelData(
        polygon=geometry,
        apn=parcel.get("apn") or parcel.get("parcel_id"),
        acreage=_safe_float(parcel.get("acreage_calc") or parcel.get("calculated_acreage")),
        owner=parcel.get("owner"),
        address=parcel.get("site_address") or parcel.get("address"),
        raw=parcel,
    )


def _safe_float(value) -> float | None:
    """Safely convert a value to float, returning None on failure."""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None
