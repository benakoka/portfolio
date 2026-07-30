import type { PopularityPoint, ForecastPoint } from "./types";

const ALPHAS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
const BETAS = [0.01, 0.03, 0.05, 0.1, 0.15, 0.2];
const PHIS = [0.8, 0.85, 0.9, 0.93, 0.96, 0.98, 1.0];

const MIN_HISTORY_YEARS = 15;
const FIT_WINDOW_YEARS = 25;

/**
 * Fits Holt's damped-trend exponential smoothing (level + damped trend) to a
 * name's yearly popularity curve, then projects it `horizon` years forward
 * with a widening prediction interval.
 *
 * Parameters (alpha, beta, phi) are chosen by grid search rather than fixed
 * by hand — the same idea ETS/statsmodels use, just via search instead of a
 * numerical optimizer. The damping term (phi < 1) keeps long-run forecasts
 * from extrapolating an unrealistic runaway trend, which a plain linear
 * projection would do.
 *
 * The level/trend state is smoothed over the *entire* history (so it reflects
 * everything the name has done), but both the parameter search and the
 * uncertainty estimate are scored only on the trailing ~25 years of one-step
 * errors. A name like "Mildred" swung wildly in the 1910s-40s and has been
 * flat and rare for decades; scoring fit quality against its whole history
 * would blow up the interval with irrelevant, decades-old volatility.
 */
export function forecastPopularity(
  curve: PopularityPoint[],
  horizon: number,
  currentMaxYear: number
): ForecastPoint[] {
  if (curve.length < MIN_HISTORY_YEARS) return [];
  const lastYear = curve[curve.length - 1].year;
  if (lastYear < currentMaxYear - 3) return []; // name isn't actively given anymore

  // Work in "per million" units for numerical stability.
  const y = curve.map((p) => p.share * 1_000_000);
  const n = y.length;
  const windowStart = Math.max(1, n - FIT_WINDOW_YEARS);

  let best: { alpha: number; beta: number; phi: number; sse: number } | null = null;

  for (const alpha of ALPHAS) {
    for (const beta of BETAS) {
      for (const phi of PHIS) {
        const { recentSse } = runSmoother(y, alpha, beta, phi, windowStart);
        if (!best || recentSse < best.sse) best = { alpha, beta, phi, sse: recentSse };
      }
    }
  }
  if (!best) return [];

  const { level, trend, recentSse, recentCount } = runSmoother(
    y,
    best.alpha,
    best.beta,
    best.phi,
    windowStart
  );
  const sigma = Math.sqrt(recentSse / Math.max(1, recentCount - 1));

  const points: ForecastPoint[] = [];
  let dampedTrendSum = 0;
  for (let h = 1; h <= horizon; h++) {
    dampedTrendSum += Math.pow(best.phi, h);
    const point = level + dampedTrendSum * trend;
    const halfWidth = 1.96 * sigma * Math.sqrt(h);
    points.push({
      year: lastYear + h,
      share: Math.max(0, point) / 1_000_000,
      lower: Math.max(0, point - halfWidth) / 1_000_000,
      upper: Math.max(0, point + halfWidth) / 1_000_000,
    });
  }
  return points;
}

/**
 * Runs the smoother once across the full series (so level/trend reflect all
 * history), while separately tallying one-step-ahead squared error only from
 * `windowStart` onward — that recent-window error is what drives both
 * parameter selection and the forecast's uncertainty band.
 */
function runSmoother(
  y: number[],
  alpha: number,
  beta: number,
  phi: number,
  windowStart: number
): { level: number; trend: number; recentSse: number; recentCount: number } {
  let level = y[0];
  let trend = y[1] - y[0];
  let recentSse = 0;
  let recentCount = 0;

  for (let t = 1; t < y.length; t++) {
    const forecast = level + phi * trend;
    const err = y[t] - forecast;
    if (t >= windowStart) {
      recentSse += err * err;
      recentCount++;
    }

    const newLevel = alpha * y[t] + (1 - alpha) * (level + phi * trend);
    const newTrend = beta * (newLevel - level) + (1 - beta) * phi * trend;
    level = newLevel;
    trend = newTrend;
  }

  return { level, trend, recentSse, recentCount };
}
