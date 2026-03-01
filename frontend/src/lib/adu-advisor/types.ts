/**
 * Types for the ADU Advisor financial module (standalone).
 */

export interface ZoningCity {
  city: string;
  state: string;
  county: string;
  max_adu_sqft: number;
  min_lot_sqft: number;
  setback_rear_ft: number;
  setback_side_ft: number;
  max_height_ft: number;
  owner_occupancy_required: boolean;
  max_adus_per_lot: number;
  junior_adu_allowed: boolean;
  garage_conversion_allowed: boolean;
  permit_timeline_days: string;
  permit_fee_range: string;
  impact_fees: string;
  key_laws: string[];
  notes: string;
  rent_estimates: {
    studio: [number, number];
    "1bed": [number, number];
    "2bed": [number, number];
  };
  construction_cost_per_sqft: {
    new: [number, number];
    conversion: [number, number];
    prefab: [number, number];
  };
  planning_dept: string;
  coastal_zone: boolean;
  hoa_note: string;
}

export interface BuildMethodInfo {
  key: "new" | "conversion" | "prefab";
  multiplier: number;
  description: string;
}

export interface CostRange {
  low: number;
  high: number;
  mid: number;
}

export interface RentRange {
  low: number;
  high: number;
  mid: number;
}

export interface ProjectionYear {
  year: number;
  cumulativeRent: number;
  cumulativeCost: number;
  profit: number;
}
