import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/names/db";
import { ARCHETYPE_COPY } from "@/lib/names/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const profile = getProfile(name);

  if (!profile) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0b0f16",
            color: "#eae7df",
            fontSize: 48,
          }}
        >
          Name not found
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const n = profile.name;
  const archetypeLabel = n.archetype ? ARCHETYPE_COPY[n.archetype]?.label ?? n.archetype : null;
  const topRegion = profile.geoRegions[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0b0f16",
          color: "#eae7df",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#d4ff4a", display: "flex" }} />
          <div style={{ fontSize: 22, color: "#3fd6c4", display: "flex" }}>name-profile</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 36 }}>
          <div style={{ fontSize: 84, fontWeight: 700, display: "flex" }}>{n.name}</div>
          {archetypeLabel && (
            <div
              style={{
                marginTop: 14,
                fontSize: 24,
                color: "#3fd6c4",
                border: "2px solid rgba(63,214,196,0.4)",
                borderRadius: 999,
                padding: "8px 20px",
                display: "flex",
                width: "fit-content",
              }}
            >
              ● {archetypeLabel}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 48, marginTop: 48 }}>
          {n.median_age != null && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 20, color: "#8792a6", display: "flex" }}>Median living age</div>
              <div style={{ fontSize: 56, fontWeight: 700, display: "flex" }}>{n.median_age}</div>
            </div>
          )}
          {n.peak_year != null && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 20, color: "#8792a6", display: "flex" }}>Peak year</div>
              <div style={{ fontSize: 56, fontWeight: 700, display: "flex" }}>{n.peak_year}</div>
            </div>
          )}
          {topRegion && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 20, color: "#8792a6", display: "flex" }}>Over-indexes in</div>
              <div style={{ fontSize: 56, fontWeight: 700, display: "flex" }}>{topRegion.region}</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", marginTop: "auto", fontSize: 18, color: "#8792a6" }}>
          whatdoestheinternetthinkofyourname.com · built from real SSA data
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
