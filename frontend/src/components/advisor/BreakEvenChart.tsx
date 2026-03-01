"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ProjectionYear } from "@/lib/adu-advisor/types";
import { formatCurrency } from "@/lib/adu-advisor/financial-calc";

interface BreakEvenChartProps {
  data: ProjectionYear[];
  costOneTime: number;
}

export function BreakEvenChart({ data, costOneTime }: BreakEvenChartProps) {
  const chartData = data.map((d) => ({
    year: `Year ${d.year}`,
    cumulativeRent: d.cumulativeRent,
    cumulativeCost: costOneTime,
    profit: d.profit,
  }));

  return (
    <div className="h-64 w-full rounded-xl bg-zinc-800/50 border border-zinc-700 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
          <YAxis
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#27272a",
              border: "1px solid #52525b",
              borderRadius: "8px",
            }}
            formatter={(value: number | undefined) => [value != null ? formatCurrency(value) : "", ""]}
            labelFormatter={(label) => label}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) => (
              <span className="text-zinc-400">{value}</span>
            )}
          />
          <ReferenceLine y={costOneTime} stroke="#71717a" strokeDasharray="2 2" />
          <Line
            type="monotone"
            dataKey="cumulativeCost"
            name="Total cost"
            stroke="#8B7355"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="cumulativeRent"
            name="Cumulative rent"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke="#6366f1"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
