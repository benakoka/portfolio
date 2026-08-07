import type { NameRow, PopularityPoint } from "../types";
import { currentSpellStartYear, getMaxYear, getSurvivalCurve, getSurvivalMeta } from "../db";
import type { MilestoneResult, SurvivalPoint, SurvivalResult } from "./types";

export const SURVIVAL_THRESHOLDS = [100, 500, 1000] as const;
const PROJECTION_YEARS = 30;

/** Population-level survival probability of remaining above the threshold for `tYears`, from the precomputed KM curve. Flat-extrapolated past the observed range. */
function survivalAt(threshold: number, tYears: number): number | null {
  if (tYears <= 0) return 1;
  const pts = getSurvivalCurve(threshold);
  if (pts.length === 0) return null;
  const rounded = Math.round(tYears);
  if (rounded >= pts[pts.length - 1].t) return pts[pts.length - 1].survival;
  const row = pts.find((p) => p.t === rounded);
  return row ? row.survival : pts[pts.length - 1].survival;
}

/**
 * For each rank threshold, either:
 *  - the name is currently above it: report conditional survival (given it's
 *    already survived `yearsInCurrentSpell`, via S(s+t)/S(s) -- the standard
 *    Kaplan-Meier conditional-survival identity), or
 *  - it isn't: reuse the *same* milestone-reaching probability already
 *    computed by the Peak Popularity model for that threshold (rather than
 *    re-deriving a second "will it get there" estimate), paired with the
 *    unconditional population median/typical duration as "how long it would
 *    likely stay, if it gets there."
 */
export function estimateSurvival(
  n: NameRow,
  curve: PopularityPoint[],
  milestonesByThreshold: Map<number, MilestoneResult>
): SurvivalResult[] {
  const latestYear = getMaxYear();
  const lastPoint = curve.length > 0 ? curve[curve.length - 1] : null;
  const isActiveNow = lastPoint != null && lastPoint.year === latestYear;
  const currentRank = lastPoint?.rank ?? null;

  return SURVIVAL_THRESHOLDS.map((threshold): SurvivalResult => {
    const meta = getSurvivalMeta(threshold);
    const currentlyAbove = isActiveNow && currentRank != null && currentRank <= threshold;

    if (currentlyAbove) {
      const spellStart = currentSpellStartYear(curve, threshold) ?? latestYear;
      const yearsInCurrentSpell = latestYear - spellStart + 1;
      const base = survivalAt(threshold, yearsInCurrentSpell) ?? 1;

      const conditional = (extraYears: number): number | null => {
        const s = survivalAt(threshold, yearsInCurrentSpell + extraYears);
        return s != null && base > 0 ? Math.min(1, s / base) : null;
      };

      let medianRemaining: number | null = null;
      for (const pt of getSurvivalCurve(threshold)) {
        if (pt.t < yearsInCurrentSpell) continue;
        const cond = base > 0 ? pt.survival / base : null;
        if (cond != null && cond <= 0.5) {
          medianRemaining = pt.t - yearsInCurrentSpell;
          break;
        }
      }

      const curveOut: SurvivalPoint[] = [];
      for (let extra = 0; extra <= PROJECTION_YEARS; extra++) {
        curveOut.push({ year: latestYear + extra, survival: conditional(extra) });
      }

      return {
        threshold,
        label: `Top ${threshold}`,
        currentlyAbove: true,
        yearsInCurrentSpell,
        p5: conditional(5),
        p10: conditional(10),
        p20: conditional(20),
        medianRemaining,
        curve: curveOut,
        entryProbability: null,
        entryExpectedDuration: null,
        sampleSize: meta.totalSpells,
      };
    }

    const milestone = milestonesByThreshold.get(threshold);
    const curveOut: SurvivalPoint[] = [];
    for (let t = 0; t <= PROJECTION_YEARS; t++) {
      curveOut.push({ year: latestYear + t, survival: survivalAt(threshold, t) });
    }

    return {
      threshold,
      label: `Top ${threshold}`,
      currentlyAbove: false,
      yearsInCurrentSpell: null,
      p5: survivalAt(threshold, 5),
      p10: survivalAt(threshold, 10),
      p20: survivalAt(threshold, 20),
      medianRemaining: meta.medianT,
      curve: curveOut,
      entryProbability: milestone?.forwardProbability ?? null,
      entryExpectedDuration: meta.medianT,
      sampleSize: meta.totalSpells,
    };
  });
}
