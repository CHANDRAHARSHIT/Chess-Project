/**
 * Anti-Cheat System — shared domain types.
 * Spec: `reference_docs/Feature Definition: Anti-cheat System`. See ./README.md.
 */

/** Suspect's strength band. "unknown" = too little history to classify. */
export type ProficiencyLevel = "average" | "expert" | "unknown";

/** Drives detection intensity only — never penalty severity. See PenaltyManager. */
export type EventType =
  | "unrated_game"
  | "rated_game"
  | "tournament_no_prize"
  | "tournament_with_prize";

/** The unit thresholds and responses are defined against — never a bare game. */
export interface Situation {
  readonly proficiency: ProficiencyLevel;
  readonly eventType: EventType;
}

/** User under examination. Never asserts guilt — only a resolved ReviewCase does. */
export interface Suspect {
  readonly userId: string;
  readonly ratingAtEvent: number;
  readonly proficiency: ProficiencyLevel;
  readonly priorStrikeCount: number;
  readonly underHeightenedScrutiny: boolean;
}

/** A user harmed by a violation. Compensation makes these whole. */
export interface AffectedUser {
  readonly userId: string;
  readonly gameRecordId: string;
  readonly ratingPointsLost?: number;
  readonly forfeitedPrizeRank?: number;
}

/**
 * The three archetypes detection is designed against separately.
 * obvious = unconcealed engine use; average = selective; expert = adversarial.
 */
export type CheaterType = "obvious" | "average" | "expert";

/**
 * One ply as the ACS needs it.
 *
 * Deliberately not `contracts.Move` — that type is opaque to everything but its
 * Variant and carries no timing. Populating this needs a Session change.
 */
export interface AnalyzedMove {
  readonly ply: number;
  readonly side: number;
  readonly fenBefore: string;
  readonly san: string;
  /** The move in UCI ("e2e4", "e7e8q"), for comparison against engine output. */
  readonly uci?: string;
  /** Server-measured. A client-reported time is trivially forged. */
  readonly thinkTimeMs: number;
  readonly clockRemainingMs: number;
  readonly evalBeforeCp?: number;
  readonly evalAfterCp?: number;
  readonly engineBestMoves?: readonly string[];
  /** Legal moves available before this ply. A forced move carries no signal. */
  readonly legalMoveCount?: number;
}

/** The material a set of Checks runs against. Scope is decided by the Trigger. */
export interface AnalysisWindow {
  readonly windowId: string;
  readonly suspect: Suspect;
  readonly situation: Situation;
  readonly gameRecordIds: readonly string[];
  /** Suspect's moves only, in order. */
  readonly moves: readonly AnalyzedMove[];
  readonly inProgress: boolean;
}

/** Widened, not a union: checks must be addable and retirable without a code change. */
export type CheckId = string;

export interface CheckResult {
  readonly checkId: CheckId;
  /** Detection Check Score, 1–100. */
  readonly score: number;
  /** 0–1. Distinct from score: high confidence in a low score is meaningful. */
  readonly confidence: number;
  /** For the arbiter. Never surfaced to the suspect. */
  readonly evidence: readonly string[];
}

/** One anomaly. Escalation is driven by accumulated flags, never by one. */
export interface RedFlag {
  readonly flagId: string;
  readonly userId: string;
  readonly checkId: CheckId;
  readonly situation: Situation;
  readonly gameRecordIds: readonly string[];
  readonly raisedAt: Date;
  readonly score: number;
}

/** `detected` means the threshold was crossed — not that the user cheated. */
export interface DetectionOutcome {
  readonly windowId: string;
  readonly suspect: Suspect;
  readonly situation: Situation;
  readonly results: readonly CheckResult[];
  readonly totalScore: number;
  readonly threshold: number;
  readonly detected: boolean;
  /** Calibrated probability of a violation, 0–1. */
  readonly certainty: number;
  readonly evaluatedAt: Date;
}

/** Initially all checks run or none. Check tiering is deferred. */
export type TriggerPoint =
  | "in_game_move"
  | "post_game"
  | "between_tournament_rounds"
  | "tournament_end"
  | "user_report"
  | "manual_review";

/** Each level raises scrutiny, not just consequence. See EscalationLadder. */
export type EscalationLevel = 0 | 1 | 2 | 3;

/** Ordered by the certainty each requires — see PenaltyManager.canApply. */
export type PenaltyAction =
  | "increase_monitoring"
  | "warning"
  | "strike"
  | "restrict_from_prize_events"
  | "restrict_from_rated_events"
  | "suspend_from_current_event"
  | "temporary_ban"
  | "permanent_ban";

export interface AppliedPenalty {
  readonly penaltyId: string;
  readonly userId: string;
  readonly action: PenaltyAction;
  readonly level: EscalationLevel;
  readonly situation: Situation;
  readonly appliedAt: Date;
  readonly expiresAt?: Date;
  readonly caseId: string;
  readonly reversed: boolean;
}

export type CaseStatus =
  | "open"
  | "awaiting_arbiter"
  | "under_review"
  | "upheld"
  | "overturned"
  | "appealed"
  | "closed";

/** Must be self-contained: arbiters are external contractors with no platform access. */
export interface ReviewCase {
  readonly caseId: string;
  readonly suspect: Suspect;
  readonly situation: Situation;
  readonly status: CaseStatus;
  readonly outcomes: readonly DetectionOutcome[];
  readonly flags: readonly RedFlag[];
  readonly affectedUsers: readonly AffectedUser[];
  readonly openedAt: Date;
  readonly assignedArbiterId?: string;
  readonly resolvedAt?: Date;
  readonly resolutionNotes?: string;
}
