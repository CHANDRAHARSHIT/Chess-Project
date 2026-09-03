/**
 * Turns accumulated evidence into increasing scrutiny.
 *
 * The point is that each level raises *scrutiny*, not just consequence: a level-1
 * user has every game analysed rather than a sample. That's what keeps false
 * positives low — an innocent user who trips one flag is watched more closely
 * and, playing normally, never escalates again.
 *
 * Driven by accumulated flags across games, never by one outcome.
 */

import type {
  DetectionOutcome,
  EscalationLevel,
  PenaltyAction,
  RedFlag,
  Situation,
} from "../types.js";
import type { PolicyRegistry } from "../feedback/PolicyRegistry.js";

export interface EscalationState {
  readonly userId: string;
  readonly level: EscalationLevel;
  readonly activeFlags: readonly RedFlag[];
  readonly enteredLevelAt: Date;
  /** When heightened scrutiny lapses back to sampled analysis. */
  readonly scrutinyExpiresAt?: Date;
}

export class EscalationLadder {
  constructor(private readonly policy: PolicyRegistry) {}

  getState(userId: string): Promise<EscalationState> {
    throw new Error("Not implemented");
  }

  /** Recording is not escalating. Flags accumulate; evaluateEscalation decides. */
  recordFlag(flag: RedFlag): Promise<void> {
    throw new Error("Not implemented");
  }

  /** Returns the same level when flags don't yet constitute a pattern — the common case. */
  evaluateEscalation(userId: string, outcome: DetectionOutcome): Promise<EscalationLevel> {
    throw new Error("Not implemented");
  }

  /** Idempotent per (user, outcome): a retry must not push someone two levels. */
  escalate(userId: string, to: EscalationLevel, caseId: string): Promise<EscalationState> {
    throw new Error("Not implemented");
  }

  actionsForLevel(level: EscalationLevel, situation: Situation): readonly PenaltyAction[] {
    throw new Error("Not implemented");
  }

  isUnderHeightenedScrutiny(userId: string): Promise<boolean> {
    throw new Error("Not implemented");
  }

  /**
   * Called on upheld appeals and on lapsed scrutiny windows. Without the second
   * path the ladder only ratchets up and one bad week follows a player forever.
   */
  deescalate(userId: string, to: EscalationLevel, reason: string): Promise<EscalationState> {
    throw new Error("Not implemented");
  }
}
