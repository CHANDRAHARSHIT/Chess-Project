/**
 * Appeals against ACS decisions.
 *
 * Load-bearing, not a courtesy: any usefully sensitive detector produces false
 * positives, and the appeal path is what makes those recoverable. Strong
 * detection with no credible appeal is worse in practice than weaker detection
 * with one.
 *
 * The appellant learns what they're accused of and in which games — never
 * thresholds or weights. An appeal response is the most direct channel a
 * determined cheater has for probing the detector.
 */

import type { AppealStatus, AppliedPenalty, ReviewCase } from "../types.js";

export interface Appeal {
  readonly appealId: string;
  readonly caseId: string;
  readonly userId: string;
  readonly status: AppealStatus;
  readonly grounds: string;
  readonly submittedAt: Date;
  readonly reviewerId?: string;
  readonly decidedAt?: Date;
  readonly decisionReasoning?: string;
}

export class AppealService {
  isEligibleToAppeal(caseId: string, userId: string): Promise<boolean> {
    throw new Error("Not implemented");
  }

  submitAppeal(caseId: string, userId: string, grounds: string): Promise<Appeal> {
    throw new Error("Not implemented");
  }

  /** Must not be whoever decided the original case. */
  assignIndependentReviewer(appealId: string, reviewerId: string): Promise<Appeal> {
    throw new Error("Not implemented");
  }

  /**
   * On upheld: reverses penalties, de-escalates, and compensates. Reversing the
   * penalty alone leaves the user down the rating points it cost them.
   */
  decideAppeal(
    appealId: string,
    upheld: boolean,
    reviewerId: string,
    reasoning: string
  ): Promise<Appeal> {
    throw new Error("Not implemented");
  }

  /** Narrow by design: what was found and what follows, never scores or thresholds. */
  getAppellantView(appealId: string, userId: string): Promise<Readonly<Record<string, unknown>>> {
    throw new Error("Not implemented");
  }

  getAppealsForUser(userId: string): Promise<readonly Appeal[]> {
    throw new Error("Not implemented");
  }

  getReversedPenalties(appealId: string): Promise<readonly AppliedPenalty[]> {
    throw new Error("Not implemented");
  }

  getOriginatingCase(appealId: string): Promise<ReviewCase | null> {
    throw new Error("Not implemented");
  }
}
