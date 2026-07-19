"use client";

import { useEffect, useState, useMemo } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import { FIPS_TO_USPS, STATE_NAMES, indexToColor } from "@/lib/names/geo";
import type { GeoStateRow, GeoRegionRow } from "@/lib/names/types";

const WIDTH = 960;
const HEIGHT = 600;

export default function GeoChoropleth({
  name,
  geoStates,
  geoRegions,
}: {
  name: string;
  geoStates: GeoStateRow[];
  geoRegions: GeoRegionRow[];
}) {
  const [topo, setTopo] = useState<FeatureCollection<Geometry> | null>(null);
  const [hover, setHover] = useState<{ usps: string; index: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/us-states-10m.json")
      .then((r) => r.json())
      .then((topology: Topology) => {
        if (cancelled) return;
        const fc = feature(
          topology,
          topology.objects.states as GeometryCollection
        ) as unknown as FeatureCollection<Geometry>;
        setTopo(fc);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const indexByState = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of geoStates) m.set(row.state, row.index);
    return m;
  }, [geoStates]);

  const path = useMemo(() => {
    if (!topo) return null;
    const projection = geoAlbersUsa().fitSize([WIDTH, HEIGHT], topo);
    return geoPath(projection);
  }, [topo]);

  const topRegion = geoRegions[0];

  if (geoStates.length === 0) {
    return (
      <div className="rounded-card border border-line bg-panel p-6">
        <h3 className="text-lg font-semibold mb-2">Geographic fingerprint</h3>
        <p className="text-sm text-muted">
          Limited US state-level data for this name.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Geographic fingerprint</h3>
      <p className="text-sm text-muted mb-4">
        {topRegion ? (
          <>
            <strong className="text-paper">{name}s</strong> are{" "}
            <strong className="text-paper">{topRegion.index.toFixed(1)}x</strong>{" "}
            more common in the{" "}
            <strong className="text-paper">{topRegion.region}</strong> than the
            national average.
          </>
        ) : (
          "Geographic over-index by state, relative to the national baseline."
        )}
      </p>

      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
          {topo && path
            ? topo.features.map((f) => {
                const usps = FIPS_TO_USPS[String(f.id)];
                const idx = usps ? indexByState.get(usps) : undefined;
                return (
                  <path
                    key={String(f.id)}
                    d={path(f) ?? undefined}
                    fill={indexToColor(idx)}
                    stroke="var(--ink)"
                    strokeWidth={0.75}
                    onMouseEnter={() => usps && idx !== undefined && setHover({ usps, index: idx })}
                    onMouseLeave={() => setHover(null)}
                    className="transition-opacity hover:opacity-80"
                  />
                );
              })
            : (
              <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" fill="var(--muted)" fontSize={14}>
                Loading map…
              </text>
            )}
        </svg>
        {hover && (
          <div className="absolute top-2 left-2 rounded-lg border border-line bg-panel-2 px-3 py-2 text-xs pointer-events-none">
            <div className="font-semibold">{STATE_NAMES[hover.usps]}</div>
            <div className="text-muted font-mono">{hover.index.toFixed(2)}x national average</div>
          </div>
        )}
      </div>
    </div>
  );
}
