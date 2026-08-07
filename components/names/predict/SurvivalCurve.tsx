"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import type { NameRow } from "@/lib/names/types";
import type { SurvivalResult } from "@/lib/names/predict";

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

export default function SurvivalCurve({ name, results }: { name: NameRow; results: SurvivalResult[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const r = results[activeIdx];
  const chartData = r.curve.map((p) => ({ year: p.year, survival: p.survival }));

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Popularity survival model</h3>
      <p className="text-sm text-muted mb-4">
        How long names that reach a rank tier tend to stay there, estimated from every historical name&apos;s run
        above that tier (Kaplan-Meier survival analysis, right-censored for names still above it today).
      </p>

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
              Estimated chance of entering it within the forecast window:{" "}
              <strong className="text-paper">{pct(r.entryProbability)}</strong>.
            </>
          )}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 text-center mb-4">
        <div className="rounded-lg border border-line bg-panel-2 px-2 py-3">
          <div className="text-lg font-mono text-paper">{pct(r.p5)}</div>
          <div className="text-[11px] text-muted mt-1">
            {r.currentlyAbove ? "still there in 5y" : "if entered, in 5y"}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-panel-2 px-2 py-3">
          <div className="text-lg font-mono text-paper">{pct(r.p10)}</div>
          <div className="text-[11px] text-muted mt-1">
            {r.currentlyAbove ? "still there in 10y" : "if entered, in 10y"}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-panel-2 px-2 py-3">
          <div className="text-lg font-mono text-paper">{pct(r.p20)}</div>
          <div className="text-[11px] text-muted mt-1">
            {r.currentlyAbove ? "still there in 20y" : "if entered, in 20y"}
          </div>
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
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-muted">
        {r.currentlyAbove
          ? `Median years remaining above ${r.label}: ${r.medianRemaining != null ? `~${r.medianRemaining}` : `>30`}.`
          : `Names that do enter ${r.label} have historically stayed a median of ${r.medianRemaining != null ? `~${r.medianRemaining} years` : "over 30 years"}.`}{" "}
        Based on {r.sampleSize.toLocaleString()} historical {r.label} runs across every name in the dataset.
      </p>
    </div>
  );
}
