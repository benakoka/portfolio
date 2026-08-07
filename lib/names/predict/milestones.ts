import type { NameRow, PopularityPoint, ForecastPoint } from "../types";
import { getMaxYear, rankInYear, shareForRank } from "../db";
import { normalCdf } from "./stats";
import type { MilestoneResult, PeakPrediction, RankPoint } from "./types";

const MILESTONES = [1000, 500, 100, 50, 10];
const Z_95 = 1.959964;

function labelFor(threshold: number): string {
  return `Top ${threshold}`;
}

/**
 * Estimates the probability that a name's forecasted share ever clears a
 * rank threshold within the forecast horizon. Each forecast year's share is
 * treated as normally distributed (its mean is the point forecast, its
 * standard deviation is derived from the model's own 95% interval), and we
 * ask how much of that distribution clears the share level the threshold
 * required in the most recent year. Years are then combined as if
 * independent -- a simplification, since a name that's likely to be popular
 * next year is also likely to be popular the year after, so this modestly
 * overstates the "ever reaches it" probability for names hovering right at a
 * threshold. It's stated as such in the model's own explanation copy.
 */
export function predictPeakPopularity(
  n: NameRow,
  curve: PopularityPoint[],
  forecast: ForecastPoint[]
): PeakPrediction {
  const latestYear = getMaxYear();
  const hasForecast = forecast.length > 0;

  // The name's best-ever *rank* is not necessarily the same year as its
  // best-ever *share* (n.peak_year/n.peak_share): rank is relative to that
  // year's whole field of names, and how concentrated that field is has
  // shifted a lot over the dataset's 146 years (far more distinct names are
  // given today than a century ago). A smaller share today can easily beat
  // a bigger share decades ago on rank, so this scans every year the name
  // has a computed rank for rather than trusting the peak-share year.
  let bestRankEver: number | null = null;
  let bestRankYear: number | null = null;
  for (const p of curve) {
    if (p.rank != null && (bestRankEver == null || p.rank < bestRankEver)) {
      bestRankEver = p.rank;
      bestRankYear = p.year;
    }
  }

  const lastPoint = curve.length > 0 ? curve[curve.length - 1] : null;
  const currentRank = lastPoint?.rank ?? null;

  const milestones: MilestoneResult[] = MILESTONES.map((threshold) => {
    const alreadyReached = bestRankEver != null && bestRankEver <= threshold;

    // Forward-looking probability from the forecast alone -- computed
    // regardless of whether the name has *historically* reached this rank,
    // since "will it (again) be at or above this rank soon" is a different
    // question than "has it ever been." Reused as-is by the Survival model
    // for its "chance of entering" figure, so it isn't recomputed twice.
    let forwardProbability = 0;
    let etaYear: number | null = null;
    if (hasForecast) {
      const thresholdShareRaw = shareForRank(latestYear, threshold);
      const thresholdShare = (thresholdShareRaw ?? 0) / 1_000_000;
      let cumulativeMiss = 1;
      for (const f of forecast) {
        const sigma = Math.max(1e-9, (f.upper - f.lower) / (2 * Z_95));
        const z = (f.share - thresholdShare) / sigma;
        const pAtYear = normalCdf(z);
        cumulativeMiss *= 1 - pAtYear;
        if (etaYear === null && pAtYear >= 0.5) etaYear = f.year;
      }
      forwardProbability = 1 - cumulativeMiss;
    }

    return {
      threshold,
      label: labelFor(threshold),
      alreadyReached,
      reachedYear: alreadyReached ? bestRankYear : null,
      probability: alreadyReached ? 1 : forwardProbability,
      forwardProbability,
      etaYear: alreadyReached ? null : etaYear,
    };
  });

  // Predicted peak: whichever is higher, the name's historic best or its
  // best forecasted point within the horizon.
  let alreadyPeaked = true;
  let predictedPeakShare = n.peak_share ?? 0;
  let predictedPeakYear = bestRankYear ?? latestYear;
  let peakRankLow = bestRankEver ?? 1;
  let peakRankHigh = bestRankEver ?? 1;

  if (hasForecast) {
    const best = forecast.reduce((acc, f) => (f.share > acc.share ? f : acc), forecast[0]);
    if (best.share > (n.peak_share ?? 0)) {
      alreadyPeaked = false;
      predictedPeakShare = best.share;
      predictedPeakYear = best.year;
      // Wider (upper) share bound -> better (lower) rank number, and vice versa.
      peakRankLow = rankInYear(latestYear, best.upper * 1_000_000);
      peakRankHigh = rankInYear(latestYear, best.lower * 1_000_000);
    }
  }

  const predictedPeakRank = alreadyPeaked
    ? (bestRankEver ?? rankInYear(latestYear, predictedPeakShare * 1_000_000))
    : rankInYear(latestYear, predictedPeakShare * 1_000_000);

  if (alreadyPeaked) {
    peakRankLow = predictedPeakRank;
    peakRankHigh = predictedPeakRank;
  }

  const chartPoints: RankPoint[] = [
    ...curve.filter((p) => p.rank != null).map((p) => ({ year: p.year, rank: p.rank as number, isForecast: false })),
    ...forecast.map((f) => ({ year: f.year, rank: rankInYear(latestYear, f.share * 1_000_000), isForecast: true })),
  ];

  const explanation = buildExplanation(n, curve, forecast, latestYear, alreadyPeaked, bestRankYear);

  return {
    milestones,
    currentRank,
    bestRankEver,
    alreadyPeaked,
    predictedPeakRank,
    predictedPeakYear,
    peakRankLow: Math.min(peakRankLow, peakRankHigh),
    peakRankHigh: Math.max(peakRankLow, peakRankHigh),
    chartPoints,
    explanation,
    hasForecast,
  };
}

function buildExplanation(
  n: NameRow,
  curve: PopularityPoint[],
  forecast: ForecastPoint[],
  latestYear: number,
  alreadyPeaked: boolean,
  bestRankYear: number | null
): string {
  if (forecast.length === 0) {
    return `${n.name} doesn't have enough recent, continuous history for a reliable forecast, so milestone odds aren't shown -- only names still actively given with at least 15 years of data get a projection.`;
  }
  const horizon = forecast.length;
  const historyYears = curve.length;
  const trajectoryNote = alreadyPeaked
    ? `Its trend is projected to stay below its historic best over the next ${horizon} years, so the model treats ${bestRankYear} as its peak.`
    : `Its current trend is projected to set a new all-time high within the next ${horizon} years.`;
  return (
    `This forecasts ${n.name}'s share of births by fitting a damped-trend model to its last ${historyYears} years ` +
    `of data and projecting ${horizon} years forward with a widening uncertainty band. Each projected share is then ` +
    `translated into a rank by comparing it against ${latestYear}'s actual name-popularity distribution -- so the ` +
    `model implicitly assumes the overall shape of that distribution doesn't shift much over the forecast window. ` +
    `${trajectoryNote} Milestone probabilities come from how much of each year's uncertainty band clears that ` +
    `milestone's rank, combined across years as if they were independent -- which slightly overstates the odds for ` +
    `names sitting right at a threshold, since a good year is usually followed by another good year rather than an ` +
    `independent coin flip.`
  );
}
