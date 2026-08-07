"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { NameRow } from "@/lib/names/types";
import type { PeakPrediction } from "@/lib/names/predict";

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

function probabilityTone(probability: number): string {
  if (probability >= 0.66) return "border-data/40 bg-data/10 text-data";
  if (probability >= 0.33) return "border-signal/40 bg-signal/10 text-signal";
  return "border-line bg-panel-2 text-muted";
}

export default function PeakPopularityPrediction({ name, prediction }: { name: NameRow; prediction: PeakPrediction }) {
  const { milestones, hasForecast, alreadyPeaked, predictedPeakRank, predictedPeakYear, peakRankLow, peakRankHigh, chartPoints, explanation } = prediction;

  const data: ChartRow[] = chartPoints.map((p, i) => {
    const isBoundary = !p.isForecast && chartPoints[i + 1]?.isForecast;
    return {
      year: p.year,
      observed: !p.isForecast ? p.rank : undefined,
      projected: p.isForecast || isBoundary ? p.rank : undefined,
    };
  });

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Peak popularity prediction</h3>
      <p className="text-sm text-muted mb-4">
        {alreadyPeaked ? (
          <>
            <strong className="text-paper">{name.name}</strong>&apos;s modeled peak was{" "}
            <strong className="text-paper">#{predictedPeakRank.toLocaleString()}</strong> in{" "}
            <strong className="text-paper">{predictedPeakYear}</strong> -- its trend isn&apos;t projected to beat that.
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

      <div className="flex flex-wrap gap-2 mb-5">
        {milestones.map((m) => (
          <div
            key={m.threshold}
            className={`px-3 py-1.5 rounded-full border font-mono text-xs ${
              m.alreadyReached ? "border-data/40 bg-data/10 text-data" : hasForecast ? probabilityTone(m.probability) : "border-line bg-panel-2 text-muted"
            }`}
            title={m.alreadyReached ? `Reached ${m.reachedYear}` : m.etaYear ? `Most likely by ${m.etaYear}` : undefined}
          >
            {m.label}{" "}
            {m.alreadyReached
              ? `· reached ${m.reachedYear}`
              : hasForecast
                ? `· ${Math.round(m.probability * 100)}%${m.etaYear ? ` by ${m.etaYear}` : ""}`
                : "· no forecast"}
          </div>
        ))}
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
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Not enough continuous recent history to project a peak rank.
        </p>
      )}

      <p className="mt-3 text-xs text-muted">{explanation}</p>
    </div>
  );
}
