export interface MilestoneResult {
  threshold: number;
  label: string;
  alreadyReached: boolean;
  reachedYear: number | null;
  probability: number;
  /** Forecast-only probability of being at/above this rank soon, ignoring whether it was ever reached historically. */
  forwardProbability: number;
  etaYear: number | null;
}

export interface RankPoint {
  year: number;
  rank: number;
  isForecast: boolean;
}

export interface PeakPrediction {
  milestones: MilestoneResult[];
  currentRank: number | null;
  bestRankEver: number | null;
  alreadyPeaked: boolean;
  predictedPeakRank: number;
  predictedPeakYear: number;
  peakRankLow: number;
  peakRankHigh: number;
  chartPoints: RankPoint[];
  explanation: string;
  hasForecast: boolean;
}

export type LifeCycleStage = "Emerging" | "Growing" | "Peaking" | "Declining" | "Historic" | "Extinct";

export interface LifeCycleResult {
  stage: LifeCycleStage;
  explanation: string;
  yearsSincePeak: number | null;
  trend: "rising" | "stable" | "falling";
  recentGrowth: number | null;
}

export interface SurvivalPoint {
  year: number;
  survival: number | null;
}

export interface SurvivalResult {
  threshold: number;
  label: string;
  currentlyAbove: boolean;
  yearsInCurrentSpell: number | null;
  p5: number | null;
  p10: number | null;
  p20: number | null;
  medianRemaining: number | null;
  curve: SurvivalPoint[];
  entryProbability: number | null;
  entryExpectedDuration: number | null;
  sampleSize: number;
}

export interface PredictiveInsights {
  peak: PeakPrediction;
  lifecycle: LifeCycleResult;
  survival: SurvivalResult[];
}
