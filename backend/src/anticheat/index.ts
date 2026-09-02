/**
 * ACS public barrel. Import from here, never from internal paths (matches
 * `contracts/index.ts`).
 *
 * Other domains should depend on `AntiCheatSystem` alone; the individual modules
 * are exported for tests, the simulation harness, and internal admin surfaces.
 */

// ── Facade ───────────────────────────────────────────────────────────────────
export { AntiCheatSystem } from "./AntiCheatSystem.js";
export type { AntiCheatSystemDeps } from "./AntiCheatSystem.js";

// ── Shared domain types ──────────────────────────────────────────────────────
export type {
  ProficiencyLevel,
  EventType,
  Situation,
  Suspect,
  AffectedUser,
  CheaterType,
  AnalyzedMove,
  AnalysisWindow,
  CheckId,
  CheckResult,
  RedFlag,
  DetectionOutcome,
  TriggerPoint,
  EscalationLevel,
  PenaltyAction,
  AppliedPenalty,
  CaseStatus,
  CaseAppeal,
  ReviewCase,
} from "./types.js";
export { UNRESOLVED_CASE_STATUSES } from "./types.js";

// ── Post-game analysis (implemented) ─────────────────────────────────────────
export {
  analyseGame,
  analyseGameAsText,
  runBlunderAnalysis,
  loadAnalysableGame,
  shutdownAnalysis,
  GameNotAnalysableError,
} from "./AnalysisService.js";
export { registerAntiCheatActions } from "./actions.js";
export {
  loadReviewWindow,
  reviewUserHistory,
  runWholeHistoryReview,
} from "./AnalysisService.js";
export { renderReviewSummary } from "./detection/AnalysisReport.js";
export { buildReviewWindow } from "./detection/ReviewWindow.js";
export type {
  ReviewWindow,
  ReviewGame,
  ReviewWindowInput,
  ExcludedGame,
  GameExclusionReason,
} from "./detection/ReviewWindow.js";
export {
  selectScoredPlies,
  countExclusions,
  findExclusionReason,
} from "./detection/ScoredMoves.js";
export type { PlyExclusionReason } from "./detection/ScoredMoves.js";
export { scoreReviewWindow } from "./detection/ReviewScoring.js";
export {
  calculateAccuracy,
  calculateAccuracySpread,
  calculateEngineMatchRate,
  calculateLongestEngineStreak,
} from "./detection/Signals.js";
export {
  buildSignalWindowScore,
  calculateMedian,
  calculateScoreFromZ,
  calculateZScore,
} from "./detection/SignalScoring.js";
export type { GameSignalValue, SignalWindowScore } from "./detection/SignalScoring.js";
export type { BaselineContext } from "./detection/StatisticalBaselines.js";
export type {
  CertaintyPolicy,
  PatternPolicy,
  SignalThresholds,
} from "./feedback/PolicyRegistry.js";
export {
  buildPersistedPlies,
  findGameAnalysis,
  findReviewCandidates,
  saveGameAnalysis,
} from "./analysisRepository.js";
export type {
  PersistedPly,
  ReviewCandidate,
  StoredGameAnalysis,
} from "./analysisRepository.js";
export type {
  ReviewWindowPolicy,
  ScoredMovePolicy,
} from "./feedback/PolicyRegistry.js";
export { StockfishEngine } from "./detection/engine/StockfishEngine.js";
export type { PositionEval } from "./detection/engine/StockfishEngine.js";
export { GameReplay, parseStoredMoves } from "./detection/GameReplay.js";
export type { StoredMove, ReplayInput } from "./detection/GameReplay.js";
export { BlunderAnalyzer } from "./detection/BlunderAnalyzer.js";
export type { MoveQuality, ClassifiedMove, BlunderSummary } from "./detection/BlunderAnalyzer.js";
export { PostGameAnalysis, startingFenFromMetadata } from "./detection/PostGameAnalysis.js";
export type { AnalysableGame, GameAnalysisReport } from "./detection/PostGameAnalysis.js";
export { renderTextReport } from "./detection/AnalysisReport.js";
export type { MoveQualityBands } from "./feedback/PolicyRegistry.js";

// ── Detection ────────────────────────────────────────────────────────────────
export { Check } from "./detection/Check.js";
export { DetectionEngine } from "./detection/DetectionEngine.js";
export { TriggerScheduler } from "./detection/TriggerScheduler.js";
export type { TriggerContext } from "./detection/TriggerScheduler.js";
export { StatisticalBaselines } from "./detection/StatisticalBaselines.js";
export type { RatingBand, BaselineMetrics } from "./detection/StatisticalBaselines.js";
export { PlayingPersonalityService } from "./detection/PlayingPersonality.js";
export type { PersonalityProfile, PersonalityDeviation } from "./detection/PlayingPersonality.js";

export { ErrorRateCheck } from "./detection/checks/ErrorRateCheck.js";
export { BlunderRateCheck } from "./detection/checks/BlunderRateCheck.js";
export { OpeningCheck } from "./detection/checks/OpeningCheck.js";
export { MoveTimeCheck } from "./detection/checks/MoveTimeCheck.js";
export { EngineCorrelationCheck } from "./detection/checks/EngineCorrelationCheck.js";
export { PlayingPersonalityCheck } from "./detection/checks/PlayingPersonalityCheck.js";

// ── Penalty ──────────────────────────────────────────────────────────────────
export { PenaltyManager } from "./penalty/PenaltyManager.js";
export { EscalationLadder } from "./penalty/EscalationLadder.js";
export type { EscalationState } from "./penalty/EscalationLadder.js";

// ── Compensation ─────────────────────────────────────────────────────────────
export { CompensationManager } from "./compensation/CompensationManager.js";
export type { CompensationRecord } from "./compensation/CompensationManager.js";

// ── Review (offender review & appeals) ───────────────────────────────────────
export {
  CaseManager,
  CaseAccessError,
  CaseAlreadyResolvedError,
  CaseNotFoundError,
} from "./review/CaseManager.js";
export type { ArbiterDecision, ArbiterPacket } from "./review/CaseManager.js";
export { collectEvidence, prismaCaseRepository } from "./review/caseRepository.js";
export type { CaseChanges, CaseRepository, NewCaseInput } from "./review/caseRepository.js";
export { AppealService } from "./review/AppealService.js";
export type { Appeal } from "./review/AppealService.js";
export type { AppealStatus } from "./types.js";

// ── Simulation ───────────────────────────────────────────────────────────────
export { CheatInjector } from "./simulation/CheatInjector.js";
export type { CheatMethod, InjectionSpec, InjectedGame } from "./simulation/CheatInjector.js";
export { SimulationRunner } from "./simulation/SimulationRunner.js";
export type {
  CheatingLevel,
  SimulationScenario,
  SimulationRunConfig,
  SimulationOutcome,
} from "./simulation/SimulationRunner.js";
export { DetectionMetrics } from "./simulation/DetectionMetrics.js";
export type { MetricsReport, CheckEffectiveness } from "./simulation/DetectionMetrics.js";

// ── Feedback & Correction ────────────────────────────────────────────────────
export { PolicyRegistry } from "./feedback/PolicyRegistry.js";
export type { PolicyValue, CheckWeighting } from "./feedback/PolicyRegistry.js";
export { EffectivenessReview } from "./feedback/EffectivenessReview.js";
export type { PolicyProposal, DocumentFeedback } from "./feedback/EffectivenessReview.js";

// ── Public ───────────────────────────────────────────────────────────────────
export { ReportService } from "./public/ReportService.js";
export type { CheatReport, ReportCategory, ReportStatus } from "./public/ReportService.js";
export { EligibilityService } from "./public/EligibilityService.js";
export type {
  EligibilityVerdict,
  EligibilityRoute,
  PlacementResult,
} from "./public/EligibilityService.js";
