/**
 * Makes Affected Users whole. Runs only after a case resolves as upheld —
 * compensating on detection alone means clawing rating back after a won appeal.
 *
 * Every method moves rating points or money, so all must be idempotent: a
 * duplicated payout is unrecoverable.
 *
 * Prize methods are blocked on a tournament domain, which doesn't exist yet
 * (GameRecord.tournamentContext is opaque passthrough JSON).
 */

import type { AffectedUser, ReviewCase, Situation } from "../types.js";

export interface CompensationRecord {
  readonly compensationId: string;
  readonly userId: string;
  readonly caseId: string;
  readonly kind: "rating_restoration" | "prize_redistribution" | "event_credit" | "acknowledgement";
  readonly ratingPointsRestored?: number;
  readonly amountMinorUnits?: number;
  readonly currency?: string;
  readonly issuedAt: Date;
  readonly notes?: string;
}

export class CompensationManager {
  /**
   * Broader than direct opponents: a cheater altering standings affects players
   * they never faced, through pairings, tiebreaks, and prize placement.
   */
  identifyAffectedUsers(caseId: string): Promise<readonly AffectedUser[]> {
    throw new Error("Not implemented");
  }

  determineCompensation(
    affected: AffectedUser,
    situation: Situation
  ): Promise<readonly CompensationRecord[]> {
    throw new Error("Not implemented");
  }

  /** Not a transfer from the cheater — the two amounts need not match once a whole event is recomputed. */
  restoreRating(userId: string, gameRecordId: string, points: number): Promise<CompensationRecord> {
    throw new Error("Not implemented");
  }

  /** Blocked on a tournament domain. Money must move through the existing payment layer. */
  redistributePrize(caseId: string, tournamentId: string): Promise<readonly CompensationRecord[]> {
    throw new Error("Not implemented");
  }

  revokeIllegitimateGains(userId: string, caseId: string): Promise<void> {
    throw new Error("Not implemented");
  }

  compensate(resolvedCase: ReviewCase): Promise<readonly CompensationRecord[]> {
    throw new Error("Not implemented");
  }

  getCompensationHistory(userId: string): Promise<readonly CompensationRecord[]> {
    throw new Error("Not implemented");
  }
}
