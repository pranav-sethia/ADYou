/**
 * Shared TypeScript types for the ADU Feasibility Engine frontend.
 */

/* ------------------------------------------------------------------ */
/*  API contract (mirrors backend Pydantic models)                    */
/* ------------------------------------------------------------------ */

export interface GeoJSONGeometry {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
}

export interface ValidationRequest {
    property_boundary: GeoJSONGeometry;
    location: string;
}

export interface ObstacleDetail {
    name: string;
    area_sqft: number;
}

export interface ValidationResponse {
    is_valid: boolean;
    message: string;
    property_area_sqft: number;
    buildable_area_sqft: number;
    setback_ft: number;
    max_adu_sqft: number;
    est_cost_low: number | null;
    est_cost_high: number | null;
    obstacles: ObstacleDetail[];
    buildable_zone_geojson: GeoJSONGeometry | null;
}
