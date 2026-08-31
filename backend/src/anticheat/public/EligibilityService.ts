/**
 * Gates rated games and prize tournaments behind enough history to classify a player.
 *
 * Without it, a fresh account is a way into a prize event with detection
 * effectively disabled — every Situation depends on proficiency, and a new
 * account has none.
 *
 * Offers routes through rather than a wall: play rated games, submit a FIDE ID,
 * or take a placement quiz. Unrated casual play is never gated.
 */

import type { EventType, ProficiencyLevel, Situation } from "../types.js";

export interface EligibilityVerdict {
  readonly eligible: boolean;
  readonly reason?: string;
  /** In the order they should be offered. */
  readonly remediations: readonly EligibilityRoute[];
}

export type EligibilityRoute = "play_rated_games" | "submit_fide_id" | "complete_placement_quiz";

export interface PlacementResult {
  readonly userId: string;
  readonly estimatedProficiency: ProficiencyLevel;
  readonly estimatedRating: number;
  readonly completedAt: Date;
}

export class EligibilityService {
  checkEligibility(userId: string, eventType: EventType): Promise<EligibilityVerdict> {
    throw new Error("Not implemented");
  }

  hasSufficientHistory(userId: string): Promise<boolean> {
    throw new Error("Not implemented");
  }

  /** Returns "unknown" rather than guessing — a wrong band mis-scopes every threshold. */
  resolveProficiency(userId: string): Promise<ProficiencyLevel> {
    throw new Error("Not implemented");
  }

  resolveSituation(userId: string, eventType: EventType): Promise<Situation> {
    throw new Error("Not implemented");
  }

  recordPlacementResult(result: PlacementResult): Promise<void> {
    throw new Error("Not implemented");
  }

  /** Verified, not self-reported — a sandbagger would happily supply an unverified ID. */
  recordVerifiedFideId(userId: string, fideId: string, verifiedRating: number): Promise<void> {
    throw new Error("Not implemented");
  }
}
