import { ARCHETYPE_COPY } from "@/lib/names/types";

export default function TrendBadge({ archetype }: { archetype: string | null }) {
  if (!archetype) return null;
  const copy = ARCHETYPE_COPY[archetype] ?? { label: archetype, blurb: "" };
  return (
    <div className="relative inline-block group">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-data/40 bg-data/10 text-data font-mono text-xs w-fit cursor-default"
      >
        ● {copy.label}
      </button>
      {copy.blurb && (
        <div
          role="tooltip"
          className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-line bg-panel-2 px-3 py-2 text-xs text-muted opacity-0 pointer-events-none transition-opacity z-20 shadow-lg group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {copy.blurb}
        </div>
      )}
    </div>
  );
}
