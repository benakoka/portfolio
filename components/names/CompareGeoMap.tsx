"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import { FIPS_TO_USPS, STATE_NAMES, compareStateColor, COMPARE_SCALE } from "@/lib/names/geo";
import type { NameProfile } from "@/lib/names/types";

const WIDTH = 960;
const HEIGHT = 600;

export default function CompareGeoMap({
  profileA,
  profileB,
}: {
  profileA: NameProfile;
  profileB: NameProfile;
}) {
  const [topo, setTopo] = useState<FeatureCollection<Geometry> | null>(null);
  const [hover, setHover] = useState<{ usps: string; a?: number; b?: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleEnter(e: React.MouseEvent<SVGPathElement>, usps: string, a: number | undefined, b: number | undefined) {
    const pathRect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const x = pathRect.left + pathRect.width / 2 - containerRect.left;
    const y = pathRect.top - containerRect.top;
    setHover({
      usps,
      a,
      b,
      x: Math.max(70, Math.min(x, containerRect.width - 70)),
      y: Math.max(0, y),
    });
  }

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

  const indexAByState = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of profileA.geoStates) m.set(row.state, row.index);
    return m;
  }, [profileA.geoStates]);

  const indexBByState = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of profileB.geoStates) m.set(row.state, row.index);
    return m;
  }, [profileB.geoStates]);

  const path = useMemo(() => {
    if (!topo) return null;
    const projection = geoAlbersUsa().fitSize([WIDTH, HEIGHT], topo);
    return geoPath(projection);
  }, [topo]);

  const nameA = profileA.name.name;
  const nameB = profileB.name.name;

  if (profileA.geoStates.length === 0 || profileB.geoStates.length === 0) {
    return (
      <div className="rounded-card border border-line bg-panel p-6">
        <h3 className="text-lg font-semibold mb-2">Where each name leans</h3>
        <p className="text-sm text-muted">
          Limited US state-level data for {profileA.geoStates.length === 0 ? nameA : nameB}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Where each name leans</h3>
      <p className="text-sm text-muted mb-4">
        Each state colored by which name is comparatively more concentrated
        there, relative to that name&apos;s own national average.
      </p>

      <div className="flex items-center gap-3 mb-4 text-xs text-muted font-mono">
        <span style={{ color: "#ba3e1c" }}>{nameB}</span>
        <div
          className="h-2 flex-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, rgb(${COMPARE_SCALE.b.join(",")}), rgb(${COMPARE_SCALE.neutral.join(",")}), rgb(${COMPARE_SCALE.a.join(",")}))`,
          }}
        />
        <span style={{ color: "var(--data)" }}>{nameA}</span>
      </div>

      <div className="relative" ref={containerRef}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
          {topo && path
            ? topo.features.map((f) => {
                const usps = FIPS_TO_USPS[String(f.id)];
                const a = usps ? indexAByState.get(usps) : undefined;
                const b = usps ? indexBByState.get(usps) : undefined;
                return (
                  <path
                    key={String(f.id)}
                    d={path(f) ?? undefined}
                    fill={compareStateColor(a, b)}
                    stroke="var(--ink)"
                    strokeWidth={0.75}
                    onMouseEnter={(e) => usps && handleEnter(e, usps, a, b)}
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
          <div
            className="absolute rounded-lg border border-line bg-panel-2 px-3 py-2 text-xs pointer-events-none whitespace-nowrap"
            style={{ left: hover.x, top: hover.y, transform: "translate(-50%, calc(-100% - 10px))" }}
          >
            <div className="font-semibold">{STATE_NAMES[hover.usps]}</div>
            <div className="font-mono" style={{ color: "var(--data)" }}>
              {nameA}: {hover.a != null ? `${hover.a.toFixed(2)}x` : "no data"}
            </div>
            <div className="font-mono" style={{ color: "#ba3e1c" }}>
              {nameB}: {hover.b != null ? `${hover.b.toFixed(2)}x` : "no data"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
