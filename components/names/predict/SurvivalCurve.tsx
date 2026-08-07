"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { motion } from "motion/react";
import type { NameRow } from "@/lib/names/types";
import type { SurvivalResult } from "@/lib/names/predict";
import InfoTooltip from "./InfoTooltip";

interface TooltipEntry {
  value?: number;
}

function SurvivalTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: number }) {
  if (!active || !payload || payload.length === 0 || payload[0].value == null) return null;
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
      <div style={{ color: "var(--muted)" }}>{Math.round(payload[0].value * 100)}% probability</div>
    </div>
  );
}

function pct(v: number | null): string {
  return v == null ? "—" : `${Math.round(v * 100)}%`;
}

const METHOD_NOTE =
  "Built from a Kaplan-Meier survival curve: every historical run any name has ever had above this tier, with runs still ongoing today counted as still in progress rather than as an exit.";

export default function SurvivalCurve({ name, results }: { name: NameRow; results: SurvivalResult[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const r = results[activeIdx];
  const chartData = r.curve.map((p) => ({ year: p.year, survival: p.survival }));
  // The 5/10/20-year tiles above are read straight off these same three
  // indices (curve[t] holds the t-years-from-now value), so marking them
  // explicitly on the chart guarantees the point you can see always matches
  // the number in the tile -- no need to eyeball where "20 years" falls
  // against evenly-spaced axis ticks.
  const markers = [
    { t: 5, value: r.p5 },
    { t: 10, value: r.p10 },
    { t: 20, value: r.p20 },
  ].filter((m): m is { t: number; value: number } => m.value != null && chartData[m.t] != null);
  const tilesHeader = r.currentlyAbove
    ? `Chance ${name.name} is still in ${r.label} after:`
    : `If ${name.name} enters ${r.label}, chance it's still there after:`;

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Popularity survival model</h3>
      <div className="flex items-start gap-1.5 mb-4">
        <p className="text-sm text-muted">
          Once a name reaches a rank tier, how long does it typically stay there before falling out?
        </p>
        <InfoTooltip text={METHOD_NOTE} className="mt-0.5" />
      </div>

      <div className="flex gap-2 mb-4">
        {results.map((res, i) => (
          <motion.button
            key={res.threshold}
            onClick={() => setActiveIdx(i)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className={`px-3 py-1.5 rounded-full border font-mono text-xs ${
              i === activeIdx ? "border-data/50 bg-data/10 text-data" : "border-line text-muted"
            }`}
          >
            {res.label}
          </motion.button>
        ))}
      </div>

      {r.currentlyAbove ? (
        <p className="text-sm text-muted mb-4">
          <strong className="text-paper">{name.name}</strong> has been in the {r.label} tier for{" "}
          <strong className="text-paper">{r.yearsInCurrentSpell}</strong> year
          {r.yearsInCurrentSpell === 1 ? "" : "s"} running.
        </p>
      ) : (
        <p className="text-sm text-muted mb-4">
          <strong className="text-paper">{name.name}</strong> isn&apos;t currently in the {r.label} tier.{" "}
          {r.entryProbability != null && (
            <>
              Estimated chance of entering it in the forecast window:{" "}
              <strong className="text-paper">{pct(r.entryProbability)}</strong>.
            </>
          )}
        </p>
      )}

      <p className="text-xs text-muted mb-2">{tilesHeader}</p>
      <div className="grid grid-cols-3 gap-3 text-center mb-4">
        <div className="rounded-lg border border-line bg-panel-2 px-2 py-3">
          <div className="text-lg font-mono text-paper">{pct(r.p5)}</div>
          <div className="text-[11px] text-muted mt-1">5 years</div>
        </div>
        <div className="rounded-lg border border-line bg-panel-2 px-2 py-3">
          <div className="text-lg font-mono text-paper">{pct(r.p10)}</div>
          <div className="text-[11px] text-muted mt-1">10 years</div>
        </div>
        <div className="rounded-lg border border-line bg-panel-2 px-2 py-3">
          <div className="text-lg font-mono text-paper">{pct(r.p20)}</div>
          <div className="text-[11px] text-muted mt-1">20 years</div>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="survivalGradient" x1="0" y1="0" x2="0" y2="1">
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
              width={40}
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
            />
            <Tooltip content={<SurvivalTooltip />} />
            <Area
              type="monotone"
              dataKey="survival"
              stroke="var(--data)"
              strokeWidth={2}
              fill="url(#survivalGradient)"
              isAnimationActive
              animationDuration={900}
            />
            {markers.map((m) => (
              <ReferenceDot
                key={m.t}
                x={chartData[m.t].year}
                y={m.value}
                r={3.5}
                fill="var(--signal)"
                stroke="var(--ink)"
                strokeWidth={1}
                label={{
                  value: `${Math.round(m.value * 100)}%`,
                  position: "top",
                  fill: "var(--paper)",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-muted">
        {r.currentlyAbove
          ? `Median years remaining above ${r.label}: ${r.medianRemaining != null ? `~${r.medianRemaining}` : `30+`}.`
          : `Names that do enter ${r.label} have historically stayed a median of ${r.medianRemaining != null ? `~${r.medianRemaining} years` : "over 30 years"}.`}{" "}
        Based on {r.sampleSize.toLocaleString()} historical {r.label} runs across every name in the dataset.
      </p>
    </div>
  );
}
