"use client";

import { formatCurrency } from "@/lib/adu-advisor/financial-calc";

interface FinancialSummaryProps {
  costLow: number;
  costHigh: number;
  costMid: number;
  rentLow: number;
  rentHigh: number;
  rentMid: number;
  breakEvenMonths: number | null;
}

export function FinancialSummary({
  costLow,
  costHigh,
  costMid,
  rentLow,
  rentHigh,
  rentMid,
  breakEvenMonths,
}: FinancialSummaryProps) {
  const breakEvenYears =
    breakEvenMonths != null ? (breakEvenMonths / 12).toFixed(1) : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-xl bg-zinc-800/80 border border-zinc-700 p-4 text-center">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
          Build cost
        </div>
        <div className="text-lg font-bold text-white">
          {formatCurrency(costLow)} – {formatCurrency(costHigh)}
        </div>
        <div className="text-sm text-zinc-400 mt-0.5">~{formatCurrency(costMid)}</div>
      </div>
      <div className="rounded-xl bg-zinc-800/80 border border-zinc-700 p-4 text-center">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
          Monthly rent
        </div>
        <div className="text-lg font-bold text-emerald-400">
          {formatCurrency(rentLow)} – {formatCurrency(rentHigh)}
        </div>
        <div className="text-sm text-zinc-400 mt-0.5">~{formatCurrency(rentMid)}/mo</div>
      </div>
      <div className="rounded-xl bg-zinc-800/80 border border-zinc-700 p-4 text-center">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
          Break-even
        </div>
        <div className="text-lg font-bold text-indigo-400">
          {breakEvenYears != null ? `${breakEvenYears} yrs` : "—"}
        </div>
        <div className="text-sm text-zinc-400 mt-0.5">
          {breakEvenMonths != null ? `${breakEvenMonths} months` : "—"}
        </div>
      </div>
    </div>
  );
}
