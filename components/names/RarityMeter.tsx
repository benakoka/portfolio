"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { NameRow, RarityInfo } from "@/lib/names/types";

export default function RarityMeter({
  name,
  rarity,
}: {
  name: NameRow;
  rarity: RarityInfo;
}) {
  const morePctThan = Math.round(rarity.percentile * 1000) / 10;
  const data = [
    { key: "filled", value: morePctThan, color: "var(--data)" },
    { key: "rest", value: Math.max(0, 100 - morePctThan), color: "var(--panel-2)" },
  ];

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Rarity</h3>
      <p className="text-sm text-muted mb-4 min-h-[2.5rem]">
        <strong className="text-paper">{name.name}</strong> ranks{" "}
        <strong className="text-paper">
          #{rarity.rank.toLocaleString()}
        </strong>{" "}
        out of{" "}
        <strong className="text-paper">
          {rarity.totalNames.toLocaleString()}
        </strong>{" "}
        names ever recorded by the SSA.
      </p>

      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="key"
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
            <span className="text-xl font-semibold text-paper leading-none">{morePctThan}%</span>
            <span className="text-[10px] text-muted leading-tight">more common</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Commonness rank</span>
          <span className="text-2xl font-mono text-paper">
            #{rarity.rank.toLocaleString()}
          </span>
          <span className="text-muted">of {rarity.totalNames.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
