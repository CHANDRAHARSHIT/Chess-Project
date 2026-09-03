/**
 * Makes Affected Users whole. Runs only after a case resolves as upheld —
 * compensating on detection alone means clawing rating back after a won appeal.
 *
 * Every method moves rating points or money, so all must be idempotent: a
 * duplicated payout is unrecoverable.
 *
 * Prize redistribution is blocked on a tournament domain, which doesn't exist yet
 * (GameRecord.tournamentContext is opaque passthrough JSON).
 */

import {
  prismaCompensationRepository,
  type CompensationRepository,
} from "./compensationRepository.js";
import type { AffectedUser, CompensationRecord, ReviewCase } from "../types.js";

/** Written when a restoration is owed but no rating exists to restore. See blocker 1. */
const NO_RATING_NOTE =
  "No rating was at stake: this game was unrated and no PlayerRating row exists. " +
  "Recorded so the debt is visible once rated play ships.";

export class CompensationManager {
  constructor(
    private readonly repository: CompensationRepository = prismaCompensationRepository
  ) {}

  /**
   * The opponents in the flagged games only. Un-flagged games in the review
   * window are ordinary play by our own analysis, so their opponents are owed
   * nothing.
   */
  async identifyAffectedUsers(reviewCase: ReviewCase): Promise<readonly AffectedUser[]> {
    return this.repository.findOpponentsInGames(
      reviewCase.flaggedGameRecordIds,
      reviewCase.suspect.userId
    );
  }

  /**
   * Safe to call twice: a repeat write hits the database's unique index and the
   * existing record is returned instead.
   *
   * An overturned or still-open case owes nobody, so it produces no records.
   */
  async compensate(resolvedCase: ReviewCase): Promise<readonly CompensationRecord[]> {
    if (resolvedCase.status !== "upheld") return [];

    const affectedUsers = await this.identifyAffectedUsers(resolvedCase);
    const records: CompensationRecord[] = [];

    for (const affected of affectedUsers) {
      records.push(await this.saveRatingRestoration(resolvedCase.caseId, affected));
    }

    return records;
  }

  getCompensationHistory(userId: string): Promise<readonly CompensationRecord[]> {
    return Promise.resolve(this.repository.findCompensationHistory(userId));
  }

  private async saveRatingRestoration(
    caseId: string,
    affected: AffectedUser
  ): Promise<CompensationRecord> {
    const points = affected.ratingPointsLost ?? 0;

    return this.repository.saveCompensation({
      userId: affected.userId,
      caseId,
      kind: "rating_restoration",
      gameRecordId: affected.gameRecordId,
      ratingPointsRestored: points,
      ...(points === 0 ? { notes: NO_RATING_NOTE } : {}),
    });
  }
}
