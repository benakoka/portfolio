"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import type { NameRow, PopularityPoint, ForecastPoint } from "@/lib/names/types";
import TrendBadge from "./TrendBadge";

interface ChartRow {
  year: number;
  perMillion?: number;
  forecastMid?: number;
  forecastRange?: [number, number];
  isForecast?: boolean;
}

export default function PopularityChart({
  name,
  curve,
  forecast,
}: {
  name: NameRow;
  curve: PopularityPoint[];
  forecast: ForecastPoint[];
}) {
  const historical: ChartRow[] = curve.map((p, i) => {
    const perMillion = Math.round(p.share * 1_000_000);
    const isBoundary = i === curve.length - 1 && forecast.length > 0;
    return {
      year: p.year,
      perMillion,
      forecastMid: isBoundary ? perMillion : undefined,
      forecastRange: isBoundary ? [perMillion, perMillion] : undefined,
    };
  });

  const projected: ChartRow[] = forecast.map((p) => ({
    year: p.year,
    forecastMid: Math.round(p.share * 1_000_000),
    forecastRange: [Math.round(p.lower * 1_000_000), Math.round(p.upper * 1_000_000)],
    isForecast: true,
  }));

  const data = [...historical, ...projected];

  const peakPoint = historical.find((d) => d.year === name.peak_year);
  const pctChange = name.pct_change_from_peak != null ? Math.round(name.pct_change_from_peak * 100) : null;
  const horizonYears = forecast.length;

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <h3 className="text-lg font-semibold">Popularity arc</h3>
        <TrendBadge archetype={name.archetype} />
      </div>
      <p className="text-sm text-muted mb-4">
        Peak <strong className="text-paper">{name.name}</strong>: {name.peak_year}.{" "}
        {pctChange != null &&
          (pctChange < 0
            ? <>Down <strong className="text-paper">{Math.abs(pctChange)}%</strong> from peak.</>
            : <>Up <strong className="text-paper">{pctChange}%</strong> since its peak era.</>)}
      </p>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="popGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--data)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--data)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
              type="number"
              domain={["dataMin", "dataMax"]}
              tickCount={6}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
            />
            <Tooltip
              contentStyle={{
                background: "var(--panel-2)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--paper)" }}
              formatter={(value, key, item) => {
                if (key === "forecastMid" && item?.payload?.isForecast) {
                  return [`${value} per million (projected)`, "rate"];
                }
                return [`${value} per million births`, "rate"];
              }}
            />
            <Area
              type="monotone"
              dataKey="perMillion"
              stroke="var(--data)"
              strokeWidth={2}
              fill="url(#popGradient)"
              isAnimationActive
              animationDuration={900}
            />
            {horizonYears > 0 && (
              <>
                <Area
                  type="monotone"
                  dataKey="forecastRange"
                  stroke="none"
                  fill="var(--muted)"
                  fillOpacity={0.16}
                  isAnimationActive
                  animationDuration={900}
                />
                <Line
                  type="monotone"
                  dataKey="forecastMid"
                  stroke="var(--data)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  isAnimationActive
                  animationDuration={900}
                />
              </>
            )}
            {peakPoint && (
              <ReferenceDot
                x={peakPoint.year}
                y={peakPoint.perMillion}
                r={4}
                fill="var(--signal)"
                stroke="var(--ink)"
                strokeWidth={1}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {horizonYears > 0 && (
        <p className="mt-3 text-xs text-muted">
          Dashed line: a {horizonYears}-year statistical projection (Holt
          damped-trend exponential smoothing, fit to recent years), with a
          shaded 95% interval.
        </p>
      )}
    </div>
  );
}
