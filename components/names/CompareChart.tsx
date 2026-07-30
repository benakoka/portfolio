"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { NameProfile } from "@/lib/names/types";

export default function CompareChart({
  profileA,
  profileB,
}: {
  profileA: NameProfile;
  profileB: NameProfile;
}) {
  const map = new Map<number, { year: number; a?: number; b?: number }>();
  for (const p of profileA.curve) {
    map.set(p.year, { ...(map.get(p.year) ?? { year: p.year }), a: Math.round(p.share * 1_000_000) });
  }
  for (const p of profileB.curve) {
    map.set(p.year, { ...(map.get(p.year) ?? { year: p.year }), b: Math.round(p.share * 1_000_000) });
  }
  const data = Array.from(map.values()).sort((x, y) => x.year - y.year);

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-4">Popularity arcs</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <XAxis
              dataKey="year"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
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
              formatter={(value) => [`${value} per million births`, "rate"]}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted)" }} />
            <Line
              type="monotone"
              dataKey="a"
              name={profileA.name.name}
              stroke="var(--data)"
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="b"
              name={profileB.name.name}
              stroke="#ba3e1c"
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
