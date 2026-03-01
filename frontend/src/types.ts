/**
 * Shared TypeScript types for the ADU Feasibility Engine frontend.
 * Mirrors the backend Pydantic models.
 */

export type AduType =
  | "detached"
  | "garage_conversion"
  | "attached"
  | "jadu"
  | "unsure"
  | null;

export type PrimaryUse = "rental" | "family" | "str" | "personal" | null;

export interface UserProfile {
  aduType: AduType;
  blockerTypes: string[];
  hasBlockers: boolean | null;
  hasExistingStructure: boolean | null;
  primaryUse: PrimaryUse;
  onboardingComplete: boolean;
  onboardingStep: number;
}

export interface GeoJSONGeometry {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
}

export interface AnalyzeRequest {
    user_drawn_geojson?: GeoJSONGeometry;
    lat?: number;
    lng?: number;
    location: string;
}

export interface DetectedObstacle {
    name: string;
    area_sqft: number;
    confidence: number;
    geojson: GeoJSONGeometry;
}

export interface AnalyzeResponse {
    is_valid: boolean;
    message: string;
    property_geojson: GeoJSONGeometry;
    buildable_zone_geojson: GeoJSONGeometry | null;
    obstacles: DetectedObstacle[];
    property_area_sqft: number;
    buildable_area_sqft: number;
    setback_ft: number;
    max_adu_sqft: number;
    est_cost_low: number | null;
    est_cost_high: number | null;
    parcel_source: string;
    apn: string | null;
    parcel_address: string | null;
}
