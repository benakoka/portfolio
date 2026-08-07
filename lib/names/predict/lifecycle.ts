import type { NameRow, PopularityPoint } from "../types";
import { getMaxYear } from "../db";
import type { LifeCycleResult, LifeCycleStage } from "./types";

const EXTINCT_GAP_YEARS = 4;
const HISTORIC_FADE_RATIO = 0.15;
const HISTORIC_MIN_YEARS_SINCE_PEAK = 15;
const HISTORIC_MIN_TOTAL_COUNT = 1000;
const GROWTH_THRESHOLD = 0.03;
const TREND_THRESHOLD = 0.02;
const PEAKING_RECENCY_YEARS = 3;
const PEAKING_RATIO = 0.85;
const PEAKING_FLAT_GROWTH = 0.03;
const EMERGING_MAX_AGE_YEARS = 15;

/** Share at (or the nearest year before) `year`, or null if the curve starts after it. */
function shareNear(curve: PopularityPoint[], year: number): number | null {
  let best: number | null = null;
  for (const p of curve) {
    if (p.year <= year) best = p.share;
    else break;
  }
  return best;
}

/**
 * A transparent, rule-based classifier over a handful of engineered
 * features -- recent growth rate, its acceleration, how close the name is
 * to its all-time peak, how long ago that peak was, and whether it's still
 * actively given at all. Rule-based rather than a trained black box on
 * purpose: the whole point of a life-cycle label is being able to say
 * *why*, and a small decision tree makes that explanation exact rather than
 * approximated after the fact.
 */
export function classifyLifeCycle(n: NameRow, curve: PopularityPoint[]): LifeCycleResult {
  const latestYear = getMaxYear();
  const lastPoint = curve.length > 0 ? curve[curve.length - 1] : null;
  const yearsSinceActive = lastPoint ? latestYear - lastPoint.year : Infinity;
  const yearsSincePeak = n.peak_year != null ? latestYear - n.peak_year : null;
  const peakRatio =
    n.peak_share != null && n.peak_share > 0 && n.recent_share != null ? n.recent_share / n.peak_share : null;

  const shareNow = lastPoint?.share ?? null;
  const share5Ago = lastPoint ? shareNear(curve, lastPoint.year - 5) : null;
  const share10Ago = lastPoint ? shareNear(curve, lastPoint.year - 10) : null;
  const recentGrowth =
    shareNow != null && share5Ago != null && share5Ago > 0 ? Math.pow(shareNow / share5Ago, 1 / 5) - 1 : null;
  const priorGrowth =
    share5Ago != null && share10Ago != null && share10Ago > 0 ? Math.pow(share5Ago / share10Ago, 1 / 5) - 1 : null;
  const acceleration = recentGrowth != null && priorGrowth != null ? recentGrowth - priorGrowth : null;

  let stage: LifeCycleStage;
  let explanation: string;

  if (yearsSinceActive > EXTINCT_GAP_YEARS) {
    stage = "Extinct";
    explanation = `${n.name} hasn't shown up in SSA records since ${lastPoint?.year ?? n.last_year} -- fewer than 5 babies have gotten the name in any year since, which is below what the SSA even reports.`;
  } else if (
    peakRatio != null &&
    peakRatio < HISTORIC_FADE_RATIO &&
    yearsSincePeak != null &&
    yearsSincePeak > HISTORIC_MIN_YEARS_SINCE_PEAK &&
    n.total_count > HISTORIC_MIN_TOTAL_COUNT
  ) {
    stage = "Historic";
    explanation = `${n.name} peaked in ${n.peak_year} and now sits at roughly ${Math.round(peakRatio * 100)}% of that peak, ${yearsSincePeak} years later -- a name that was genuinely common once, now mostly heard from an older generation.`;
  } else if (recentGrowth != null && recentGrowth < -GROWTH_THRESHOLD) {
    stage = "Declining";
    const accelNote = acceleration != null && acceleration < -0.01 ? ", and the decline is accelerating" : "";
    explanation = `Births have shrunk about ${Math.round(Math.abs(recentGrowth) * 100)}% a year on average over the last 5 years${accelNote}.`;
  } else if (yearsSincePeak != null && yearsSincePeak <= PEAKING_RECENCY_YEARS) {
    stage = "Peaking";
    explanation = `${n.name}'s all-time high was just ${yearsSincePeak === 0 ? "this year" : `${yearsSincePeak} year${yearsSincePeak === 1 ? "" : "s"} ago (${n.peak_year})`} -- it's at or very near its historic peak right now.`;
  } else if (peakRatio != null && peakRatio > PEAKING_RATIO && recentGrowth != null && Math.abs(recentGrowth) < PEAKING_FLAT_GROWTH) {
    stage = "Peaking";
    explanation = `${n.name} is holding within ${Math.round((1 - peakRatio) * 100)}% of its all-time peak share and growth has flattened out -- it's plateaued near the top rather than still climbing or sliding.`;
  } else if (
    recentGrowth != null &&
    recentGrowth > GROWTH_THRESHOLD &&
    n.first_year != null &&
    latestYear - n.first_year <= EMERGING_MAX_AGE_YEARS
  ) {
    stage = "Emerging";
    explanation = `${n.name} has only been in common use since around ${n.first_year} and is still climbing fast, roughly ${Math.round(recentGrowth * 100)}% a year -- too young a track record to call its ceiling yet.`;
  } else if (recentGrowth != null && recentGrowth > GROWTH_THRESHOLD) {
    stage = "Growing";
    explanation = `Births have grown roughly ${Math.round(recentGrowth * 100)}% a year on average over the last 5 years, and ${n.name} hasn't yet revisited its historic peak.`;
  } else if (recentGrowth != null && recentGrowth >= 0) {
    stage = "Growing";
    explanation = `${n.name}'s popularity has been gently rising in recent years without yet approaching its historic peak.`;
  } else {
    stage = "Declining";
    explanation = `${n.name}'s popularity has been easing lower recently, though not sharply enough to call it a steep decline.`;
  }

  const trend: LifeCycleResult["trend"] =
    recentGrowth == null ? "stable" : recentGrowth > TREND_THRESHOLD ? "rising" : recentGrowth < -TREND_THRESHOLD ? "falling" : "stable";

  return { stage, explanation, yearsSincePeak, trend, recentGrowth };
}
