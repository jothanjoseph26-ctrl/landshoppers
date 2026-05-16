export {
  ADJACENT_SERVICE_CATEGORIES,
  areAdjacentCategories,
  categoryScoreComponent,
  compositeMatchScore,
  computeProviderBaselineAiScore,
  contextualMatchBreakdown,
  proximityScoreFromDistanceMeters,
  responseScoreComponent,
  tierSortMultiplier,
  trustScoreComponent,
  verificationScoreComponent,
} from "./scoring.js";
export type {
  BaselineProviderSignals,
  ContextualMatchSignals,
  MatchScoreFactors,
} from "./scoring.js";
export {
  extractBudgetKoboFromText,
  looksLikeServiceLeadIntent,
  scoreServiceLeadHeuristic,
  sourceQualityPoints,
} from "./lead-scoring.js";
export type { LeadScoreInput } from "./lead-scoring.js";
export {
  extractServiceRequestFromText,
  type ServiceRequestExtractResult,
} from "./service-request-extract.js";
