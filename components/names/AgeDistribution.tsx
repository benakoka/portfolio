"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { AgePmfBucket, NameRow } from "@/lib/names/types";

function bucketLabel(bucket: number): string {
  if (bucket >= 100) return "100+";
  return `${bucket}-${bucket + 4}`;
}

export default function AgeDistribution({
  name,
  agePmf,
}: {
  name: NameRow;
  agePmf: AgePmfBucket[];
}) {
  if (name.median_age == null) {
    return (
      <div className="rounded-card border border-line bg-panel p-6">
        <h3 className="text-lg font-semibold mb-2">Living-age distribution</h3>
        <p className="text-sm text-muted">
          Not enough living population data to estimate an age distribution for
          this name.
        </p>
      </div>
    );
  }

  const data = agePmf.map((b) => ({
    label: bucketLabel(b.age_bucket),
    bucketStart: b.age_bucket,
    pct: Math.round(b.pct * 1000) / 10,
    inRange: b.age_bucket + 4 >= (name.p15_age ?? 0) && b.age_bucket <= (name.p85_age ?? 999),
  }));

  const showSexSplit =
    name.median_age_m != null &&
    name.median_age_f != null &&
    name.pct_male != null &&
    name.pct_male > 0.15 &&
    name.pct_male < 0.85;

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Living-age distribution</h3>
      <p className="text-sm text-muted mb-4">
        The median living <strong className="text-paper">{name.name}</strong> is{" "}
        <strong className="text-paper">{name.median_age}</strong>. If you meet a{" "}
        {name.name}, there&apos;s about a 70% chance they&apos;re between{" "}
        <strong className="text-paper">{name.p15_age}</strong> and{" "}
        <strong className="text-paper">{name.p85_age}</strong> years old.
      </p>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              interval={Math.max(0, Math.floor(data.length / 8))}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "var(--panel-2)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--paper)" }}
              formatter={(value) => [`${value}%`, "share"]}
            />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.inRange ? "var(--data)" : "var(--line)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showSexSplit && (
        <p className="mt-3 text-xs text-muted">
          Among males: median {name.median_age_m} ({name.p15_age_m}–{name.p85_age_m}).
          Among females: median {name.median_age_f} ({name.p15_age_f}–{name.p85_age_f}).
        </p>
      )}
    </div>
  );
}
