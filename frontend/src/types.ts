/**
 * Shared TypeScript types for the ADU Feasibility Engine frontend.
 */

/* ------------------------------------------------------------------ */
/*  Drawing workflow state                                            */
/* ------------------------------------------------------------------ */

export type DrawingPhase = "idle" | "property" | "adu";

/* ------------------------------------------------------------------ */
/*  API contract (mirrors backend Pydantic models)                    */
/* ------------------------------------------------------------------ */

export interface GeoJSONGeometry {
    type: "Polygon";
    coordinates: number[][][];
}

export interface ValidationRequest {
    property_boundary: GeoJSONGeometry;
    adu_box: GeoJSONGeometry;
    location: string;
}

export interface ObstacleDetail {
    name: string;
    overlap_pct: number;
}

export interface ValidationResponse {
    is_valid: boolean;
    message: string;
    area_sqft: number;
    est_cost: number | null;
    violations: string[];
    obstacles: ObstacleDetail[];
}
