import type { NameRow, RarityInfo } from "@/lib/names/types";

export default function RarityMeter({
  name,
  rarity,
}: {
  name: NameRow;
  rarity: RarityInfo;
}) {
  const morePctThan = Math.round(rarity.percentile * 1000) / 10;
  const position = 1 - rarity.percentile; // 0 = most common (left), 1 = rarest (right)

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Rarity</h3>
      <p className="text-sm text-muted mb-4">
        <strong className="text-paper">{name.name}</strong> ranks{" "}
        <strong className="text-paper">
          #{rarity.rank.toLocaleString()}
        </strong>{" "}
        out of{" "}
        <strong className="text-paper">
          {rarity.totalNames.toLocaleString()}
        </strong>{" "}
        names ever recorded by the SSA — more common than{" "}
        <strong className="text-paper">{morePctThan}%</strong> of all names.
      </p>

      <div className="relative h-3 rounded-full bg-panel-2 border border-line">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-signal border border-line"
          style={{ left: `calc(${position * 100}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted font-mono">
        <span>Most common</span>
        <span>Rarest</span>
      </div>
    </div>
  );
}
