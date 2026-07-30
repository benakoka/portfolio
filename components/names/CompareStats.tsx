import { Fragment } from "react";
import { ARCHETYPE_COPY, type NameProfile } from "@/lib/names/types";

function archetypeLabel(archetype: string | null): string {
  if (!archetype) return "—";
  return ARCHETYPE_COPY[archetype]?.label ?? archetype;
}

function genderLabel(pctMale: number | null, pctFemale: number | null): string {
  if (pctMale == null || pctFemale == null) return "—";
  const male = Math.round(pctMale * 1000) / 10;
  const female = Math.round(pctFemale * 1000) / 10;
  if (male >= 97) return `${male}% male`;
  if (female >= 97) return `${female}% female`;
  return `${male}% M / ${female}% F`;
}

function topRegion(profile: NameProfile): string {
  const top = profile.geoRegions[0];
  return top ? `${top.region} (${top.index.toFixed(1)}x)` : "—";
}

export default function CompareStats({
  profileA,
  profileB,
}: {
  profileA: NameProfile;
  profileB: NameProfile;
}) {
  const a = profileA.name;
  const b = profileB.name;

  const rows: { label: string; a: string; b: string }[] = [
    { label: "Total births", a: a.total_count.toLocaleString(), b: b.total_count.toLocaleString() },
    {
      label: "Rarity rank",
      a: `#${profileA.rarity.rank.toLocaleString()} of ${profileA.rarity.totalNames.toLocaleString()}`,
      b: `#${profileB.rarity.rank.toLocaleString()} of ${profileB.rarity.totalNames.toLocaleString()}`,
    },
    { label: "Peak year", a: String(a.peak_year ?? "—"), b: String(b.peak_year ?? "—") },
    { label: "Trend archetype", a: archetypeLabel(a.archetype), b: archetypeLabel(b.archetype) },
    {
      label: "Median living age",
      a: a.median_age != null ? String(a.median_age) : "—",
      b: b.median_age != null ? String(b.median_age) : "—",
    },
    { label: "Gender split", a: genderLabel(a.pct_male, a.pct_female), b: genderLabel(b.pct_male, b.pct_female) },
    { label: "Top region", a: topRegion(profileA), b: topRegion(profileB) },
  ];

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-4">Head-to-head</h3>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-sm">
        <div />
        <div className="font-mono font-semibold text-center px-3 pb-3" style={{ color: "var(--data)" }}>
          {a.name}
        </div>
        <div className="font-mono font-semibold text-center px-3 pb-3" style={{ color: "#ba3e1c" }}>
          {b.name}
        </div>
        {rows.map((r) => (
          <Fragment key={r.label}>
            <div className="text-muted border-t border-line py-3">{r.label}</div>
            <div className="text-paper font-medium text-center px-3 border-t border-line py-3">{r.a}</div>
            <div className="text-paper font-medium text-center px-3 border-t border-line py-3">{r.b}</div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
