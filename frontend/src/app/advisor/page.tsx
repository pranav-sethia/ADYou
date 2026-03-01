"use client";

import { useState, useMemo } from "react";
import {
  getZoningCityKeys,
  getZoningByKey,
  BUILD_METHODS,
} from "@/lib/adu-advisor/zoning-db";
import {
  computeCostRange,
  computeRentRange,
  computeBreakEvenMonths,
  computeProjection,
} from "@/lib/adu-advisor/financial-calc";
import { FinancialSummary } from "@/components/advisor/FinancialSummary";
import { BreakEvenChart } from "@/components/advisor/BreakEvenChart";

const CITY_OPTIONS = getZoningCityKeys().map((k) => ({
  value: k,
  label: k.charAt(0).toUpperCase() + k.slice(1).replace(/\b\w/g, (c) => c.toUpperCase()),
}));
const BUILD_OPTIONS = Object.keys(BUILD_METHODS);
const BEDROOM_OPTIONS = [
  { value: 0, label: "Studio" },
  { value: 1, label: "1 bed" },
  { value: 2, label: "2 bed" },
  { value: 3, label: "3 bed" },
];

export default function AdvisorPage() {
  const [cityKey, setCityKey] = useState("");
  const [buildMethod, setBuildMethod] = useState("");
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [bedrooms, setBedrooms] = useState<number>(1);

  const sqft = useMemo(() => {
    const w = parseInt(width, 10);
    const l = parseInt(length, 10);
    if (Number.isNaN(w) || Number.isNaN(l) || w <= 0 || l <= 0) return 0;
    return w * l;
  }, [width, length]);

  const zoning = useMemo(() => (cityKey ? getZoningByKey(cityKey) : null), [cityKey]);

  const { costRange, rentRange, breakEvenMonths, projection } = useMemo(() => {
    if (!zoning || !buildMethod || sqft <= 0) {
      return {
        costRange: null,
        rentRange: null,
        breakEvenMonths: null as number | null,
        projection: [] as { year: number; cumulativeRent: number; cumulativeCost: number; profit: number }[],
      };
    }
    const cost = computeCostRange(zoning, sqft, buildMethod);
    const rent = computeRentRange(zoning, bedrooms);
    const breakEven = computeBreakEvenMonths(cost.mid, rent.mid);
    const proj = computeProjection(cost.mid, rent.mid, 10);
    return {
      costRange: cost,
      rentRange: rent,
      breakEvenMonths: breakEven,
      projection: proj,
    };
  }, [zoning, buildMethod, sqft, bedrooms]);

  const showResults = zoning && buildMethod && sqft > 0 && costRange && rentRange;

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/15 text-zinc-100">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">ADU Compass</p>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-2">Financial Advisor</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Estimate cost, rental income, break-even, and long-term ADU returns.
          </p>
        </header>

        <div className="grid h-[calc(100%-100px)] grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/45 p-5 overflow-y-auto backdrop-blur-md">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Project Inputs</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  City
                </label>
                <select
                  value={cityKey}
                  onChange={(e) => setCityKey(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900/90 border border-zinc-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="">Select city…</option>
                  {CITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Build method
                </label>
                <select
                  value={buildMethod}
                  onChange={(e) => setBuildMethod(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900/90 border border-zinc-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="">Select method…</option>
                  {BUILD_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Width (ft)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="e.g. 24"
                    className="w-full rounded-xl bg-zinc-900/90 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Length (ft)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full rounded-xl bg-zinc-900/90 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              {sqft > 0 && (
                <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
                  Footprint: <span className="font-semibold">{sqft.toLocaleString()} sq ft</span>
                  {zoning && sqft > zoning.max_adu_sqft && (
                    <p className="text-red-400 mt-1 text-xs">
                      Exceeds {zoning.city} max ({zoning.max_adu_sqft.toLocaleString()} sq ft)
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Bedrooms
                </label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full rounded-xl bg-zinc-900/90 border border-zinc-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  {BEDROOM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-5 overflow-y-auto backdrop-blur-md">
            {!showResults && (
              <div className="h-full flex items-center justify-center">
                <div className="max-w-md text-center rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <p className="text-zinc-300 text-lg font-medium">Ready to model your ADU?</p>
                  <p className="text-zinc-500 text-sm mt-2">
                    Fill the inputs on the left to see build cost, projected rent, and a break-even graph.
                  </p>
                </div>
              </div>
            )}

            {showResults && costRange && rentRange && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-400 mb-3">Financial Snapshot</h2>
                  <FinancialSummary
                    costLow={costRange.low}
                    costHigh={costRange.high}
                    costMid={costRange.mid}
                    rentLow={rentRange.low}
                    rentHigh={rentRange.high}
                    rentMid={rentRange.mid}
                    breakEvenMonths={breakEvenMonths}
                  />
                </div>

                {projection.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-400 mb-3">
                      10-Year Projection
                    </h2>
                    <BreakEvenChart data={projection} costOneTime={costRange.mid} />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
