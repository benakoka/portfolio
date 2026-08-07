"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
} from "recharts";
import type { NameRow } from "@/lib/names/types";
import type { PeakPrediction } from "@/lib/names/predict";
import InfoTooltip from "./InfoTooltip";

const MILESTONE_LINE_COLOR = "var(--muted)";

interface ChartRow {
  year: number;
  observed?: number;
  projected?: number;
}

interface TooltipEntry {
  dataKey?: string;
  value?: number;
}

function RankTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: number }) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload.find((p) => p.value != null);
  if (!entry) return null;
  const isProjected = entry.dataKey === "projected";
  return (
    <div
      style={{
        background: "var(--panel-2)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        fontSize: 12,
        padding: "8px 12px",
      }}
    >
      <div style={{ color: "var(--paper)", marginBottom: 2 }}>{label}</div>
      <div style={{ color: "var(--muted)" }}>
        Rank #{Math.round(entry.value ?? 0).toLocaleString()}{isProjected ? " (projected)" : ""}
      </div>
    </div>
  );
}

export default function PeakPopularityPrediction({ name, prediction }: { name: NameRow; prediction: PeakPrediction }) {
  const {
    milestones,
    hasForecast,
    alreadyPeaked,
    predictedPeakRank,
    predictedPeakYear,
    peakRankLow,
    peakRankHigh,
    chartPoints,
    explanation,
  } = prediction;

  const data: ChartRow[] = chartPoints.map((p, i) => {
    const isBoundary = !p.isForecast && chartPoints[i + 1]?.isForecast;
    return {
      year: p.year,
      observed: !p.isForecast ? p.rank : undefined,
      projected: p.isForecast || isBoundary ? p.rank : undefined,
    };
  });

  const firstForecastYear = chartPoints.find((p) => p.isForecast)?.year;
  const lastChartYear = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1].year : undefined;

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Peak popularity prediction</h3>
      <p className="text-sm text-muted mb-4">
        {alreadyPeaked ? (
          <>
            <strong className="text-paper">{name.name}</strong>&apos;s modeled peak was{" "}
            <strong className="text-paper">#{predictedPeakRank.toLocaleString()}</strong> in{" "}
            <strong className="text-paper">{predictedPeakYear}</strong>{" "}— its trend isn&apos;t projected to beat that.
          </>
        ) : (
          <>
            Trending toward a peak rank around{" "}
            <strong className="text-paper">#{predictedPeakRank.toLocaleString()}</strong> (95% range{" "}
            {peakRankLow.toLocaleString()}–{peakRankHigh.toLocaleString()}) in{" "}
            <strong className="text-paper">{predictedPeakYear}</strong>.
          </>
        )}
      </p>

      <div className="rounded-lg border border-line divide-y divide-line mb-5 overflow-hidden">
        {milestones.map((m) => {
          const pct = Math.round(m.probability * 100);
          return (
            <div key={m.threshold} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-[4.5rem] shrink-0 font-mono text-sm text-paper">{m.label}</span>
              {m.alreadyReached ? (
                <span className="flex items-center gap-1.5 text-sm text-data">
                  <span aria-hidden>✓</span> Reached in {m.reachedYear}
                </span>
              ) : !hasForecast ? (
                <span className="text-sm text-muted">No forecast available</span>
              ) : (
                <>
                  <div className="flex-1 h-1.5 rounded-full bg-panel-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(2, pct)}%`, background: "var(--data)" }}
                    />
                  </div>
                  <span className="shrink-0 text-sm text-muted text-right whitespace-nowrap">
                    <strong className="text-paper font-mono">{pct}%</strong> chance
                    {m.etaYear ? <>, by {m.etaYear}</> : null}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {hasForecast && data.length > 0 ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
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
                scale="log"
                domain={[1, "dataMax"]}
                reversed
                allowDataOverflow
                tickFormatter={(v) => `#${Math.round(v).toLocaleString()}`}
              />
              <Tooltip content={<RankTooltip />} />
              {[1000, 500, 100, 50, 10].map((t) => (
                <ReferenceLine key={t} y={t} stroke={MILESTONE_LINE_COLOR} strokeDasharray="2 3" strokeOpacity={0.5} />
              ))}
              {firstForecastYear != null && lastChartYear != null && (
                <ReferenceArea x1={firstForecastYear} x2={lastChartYear} fill="var(--data)" fillOpacity={0.06} />
              )}
              <Line
                type="monotone"
                dataKey="observed"
                stroke="var(--data)"
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={900}
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="var(--data)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive
                animationDuration={900}
              />
              <ReferenceDot
                x={predictedPeakYear}
                y={predictedPeakRank}
                r={4}
                fill="var(--signal)"
                stroke="var(--ink)"
                strokeWidth={1}
                label={{
                  value: `Peak #${predictedPeakRank.toLocaleString()}`,
                  position: "top",
                  fill: "var(--paper)",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Not enough continuous recent history to project a peak rank.
        </p>
      )}

      {hasForecast && (
        <div className="mt-3 flex items-center gap-1.5">
          <p className="text-xs text-muted">
            Projects the trend forward, then converts share into rank using this year&apos;s popularity distribution.
          </p>
          <InfoTooltip text={explanation} />
        </div>
      )}
    </div>
  );
}
