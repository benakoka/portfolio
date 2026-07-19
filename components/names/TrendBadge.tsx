import { ARCHETYPE_COPY } from "@/lib/names/types";

export default function TrendBadge({ archetype }: { archetype: string | null }) {
  if (!archetype) return null;
  const copy = ARCHETYPE_COPY[archetype] ?? { label: archetype, blurb: "" };
  return (
    <div className="inline-flex flex-col gap-1">
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-data/40 bg-data/10 text-data font-mono text-xs w-fit">
        ● {copy.label}
      </span>
      {copy.blurb && <span className="text-xs text-muted max-w-xs">{copy.blurb}</span>}
    </div>
  );
}
