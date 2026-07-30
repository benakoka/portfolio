import type { NameRow } from "@/lib/names/types";

export default function GenderBalance({ name }: { name: NameRow }) {
  if (name.pct_male == null || name.pct_female == null) {
    return (
      <div className="rounded-card border border-line bg-panel p-6">
        <h3 className="text-lg font-semibold mb-2">Gender balance</h3>
        <p className="text-sm text-muted">
          Not enough data to estimate a gender split for this name.
        </p>
      </div>
    );
  }

  const malePct = Math.round(name.pct_male * 1000) / 10;
  const femalePct = Math.round(name.pct_female * 1000) / 10;
  const dominant = malePct >= femalePct ? "male" : "female";
  const dominantPct = Math.max(malePct, femalePct);
  const isLopsided = dominantPct >= 97;
  const showSexAges =
    !isLopsided && name.median_age_m != null && name.median_age_f != null;

  return (
    <div className="rounded-card border border-line bg-panel p-6">
      <h3 className="text-lg font-semibold mb-1">Gender balance</h3>
      <p className="text-sm text-muted mb-4">
        {isLopsided ? (
          <>
            <strong className="text-paper">{name.name}</strong> is almost
            always given to {dominant} babies —{" "}
            <strong className="text-paper">{dominantPct}%</strong> {dominant}.
          </>
        ) : (
          <>
            <strong className="text-paper">{malePct}%</strong> male,{" "}
            <strong className="text-paper">{femalePct}%</strong> female.
          </>
        )}
      </p>

      <div className="h-3 rounded-full overflow-hidden flex border border-line">
        {malePct > 0 && (
          <div className="h-full bg-data" style={{ width: `${malePct}%` }} />
        )}
        {femalePct > 0 && (
          <div className="h-full bg-signal" style={{ width: `${femalePct}%` }} />
        )}
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted font-mono">
        <span>Male {malePct}%</span>
        <span>Female {femalePct}%</span>
      </div>

      {showSexAges && (
        <p className="mt-4 pt-4 border-t border-line text-xs text-muted">
          Among males: median age{" "}
          <strong className="text-paper">{name.median_age_m}</strong> (
          {name.p15_age_m}–{name.p85_age_m}). Among females: median age{" "}
          <strong className="text-paper">{name.median_age_f}</strong> (
          {name.p15_age_f}–{name.p85_age_f}).
        </p>
      )}
    </div>
  );
}
