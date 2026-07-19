import Link from "next/link";
import type { NeighborRow } from "@/lib/names/types";

export default function NameNeighbors({
  name,
  neighbors,
}: {
  name: string;
  neighbors: NeighborRow[];
}) {
  if (neighbors.length === 0) {
    return (
      <div className="rounded-card border border-line bg-panel p-6">
        <h3 className="text-lg font-semibold mb-2">Name neighbors</h3>
        <p className="text-sm text-muted">
          Not enough data to find names with a similar popularity history.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Name neighbors</h3>
      <p className="text-sm text-muted mb-4">
        People named <strong className="text-paper">{name}</strong> have
        popularity-curve siblings named:
      </p>
      <div className="flex flex-wrap gap-2">
        {neighbors.map((n) => (
          <Link
            key={n.neighbor}
            href={`/names/name/${n.neighbor.toLowerCase()}`}
            className="px-3 py-1.5 rounded-full border border-line font-mono text-sm hover:border-data hover:text-data transition-colors"
          >
            {n.neighbor}
          </Link>
        ))}
      </div>
    </div>
  );
}
