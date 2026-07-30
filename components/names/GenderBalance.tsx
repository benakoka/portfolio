"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { NameRow } from "@/lib/names/types";

export default function GenderBalance({ name }: { name: NameRow }) {
  if (name.pct_male == null || name.pct_female == null) {
    return (
      <div className="rounded-card border border-line bg-panel p-6">
        <h3 className="text-lg font-semibold mb-2">Gender balance</h3>
        <p className="text-sm text-muted">
          Not enough data to estimate a gender split for this name.
        </p>
      </div>
    );
  }

  const malePct = Math.round(name.pct_male * 1000) / 10;
  const femalePct = Math.round(name.pct_female * 1000) / 10;
  const dominant = malePct >= femalePct ? "male" : "female";
  const dominantPct = Math.max(malePct, femalePct);
  const isLopsided = dominantPct >= 97;
  const showSexAges =
    !isLopsided && name.median_age_m != null && name.median_age_f != null;

  const data = [
    { key: "male", label: "Male", value: malePct, color: "var(--data)" },
    { key: "female", label: "Female", value: femalePct, color: "var(--signal)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Gender balance</h3>
      <p className="text-sm text-muted mb-4 min-h-[2.5rem]">
        {isLopsided ? (
          <>
            <strong className="text-paper">{name.name}</strong> is almost
            always given to {dominant} babies —{" "}
            <strong className="text-paper">{dominantPct}%</strong> {dominant}.
          </>
        ) : (
          <>
            <strong className="text-paper">{malePct}%</strong> male,{" "}
            <strong className="text-paper">{femalePct}%</strong> female.
          </>
        )}
      </p>

      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius="68%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive
                animationDuration={700}
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-semibold text-paper leading-none">{dominantPct}%</span>
            <span className="text-[10px] text-muted leading-tight capitalize">{dominant}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 text-sm">
          {data.map((d) => (
            <div key={d.key} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: d.color }}
              />
              <span className="text-muted">{d.label}</span>
              <span className="text-paper font-mono ml-2">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {showSexAges && (
        <p className="mt-4 pt-4 border-t border-line text-xs text-muted">
          Among males: median age{" "}
          <strong className="text-paper">{name.median_age_m}</strong> (
          {name.p15_age_m}–{name.p85_age_m}). Among females: median age{" "}
          <strong className="text-paper">{name.median_age_f}</strong> (
          {name.p15_age_f}–{name.p85_age_f}).
        </p>
      )}
    </div>
  );
}
