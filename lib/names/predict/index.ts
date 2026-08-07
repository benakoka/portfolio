import type { NameProfile } from "../types";
import { predictPeakPopularity } from "./milestones";
import { classifyLifeCycle } from "./lifecycle";
import { estimateSurvival } from "./survival";
import type { PredictiveInsights } from "./types";

export function getPredictiveInsights(profile: NameProfile): PredictiveInsights {
  const peak = predictPeakPopularity(profile.name, profile.curve, profile.forecast);
  const lifecycle = classifyLifeCycle(profile.name, profile.curve);
  const milestonesByThreshold = new Map(peak.milestones.map((m) => [m.threshold, m]));
  const survival = estimateSurvival(profile.name, profile.curve, milestonesByThreshold);
  return { peak, lifecycle, survival };
}

export type {
  PeakPrediction,
  LifeCycleResult,
  LifeCycleStage,
  SurvivalResult,
  MilestoneResult,
  PredictiveInsights,
} from "./types";
