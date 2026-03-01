/**
 * Pure financial calculations for ADU Advisor (cost, rent, break-even, projection).
 */

import type { ZoningCity, BuildMethodInfo, CostRange, RentRange, ProjectionYear } from "./types";
import { BUILD_METHODS } from "./zoning-db";

const SQFT_TO_RENT_KEY: (bedrooms: number) => "studio" | "1bed" | "2bed" = (bedrooms) => {
  if (bedrooms >= 2) return "2bed";
  if (bedrooms === 1) return "1bed";
  return "studio";
};

export function computeCostRange(
  zoning: ZoningCity,
  sqft: number,
  buildMethodLabel: string
): CostRange {
  const method = BUILD_METHODS[buildMethodLabel];
  const key = method?.key ?? "new";
  const range = zoning.construction_cost_per_sqft[key];
  if (!range) return { low: 0, high: 0, mid: 0 };
  const low = Math.round(sqft * range[0]);
  const high = Math.round(sqft * range[1]);
  const mid = Math.round((low + high) / 2);
  return { low, high, mid };
}

export function computeRentRange(zoning: ZoningCity, bedrooms: number): RentRange {
  const key = SQFT_TO_RENT_KEY(bedrooms);
  const [low, high] = zoning.rent_estimates[key];
  const mid = Math.round((low + high) / 2);
  return { low, high, mid };
}

export function computeBreakEvenMonths(costMid: number, rentMid: number): number | null {
  if (rentMid <= 0) return null;
  return Math.round(costMid / rentMid);
}

export function computeProjection(
  costOneTime: number,
  rentMonthly: number,
  years: number
): ProjectionYear[] {
  const result: ProjectionYear[] = [];
  let cumulativeRent = 0;
  for (let y = 1; y <= years; y++) {
    cumulativeRent += rentMonthly * 12;
    result.push({
      year: y,
      cumulativeRent,
      cumulativeCost: costOneTime,
      profit: cumulativeRent - costOneTime,
    });
  }
  return result;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
