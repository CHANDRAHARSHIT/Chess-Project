/**
 * Offender review. The spec marks this component `[TODO]` and hasn't written it
 * up, so this is derived from stated goals and the staffing model — expect it to
 * change once that section lands.
 *
 * Arbiters are external FIDE-qualified contractors paid per case, so a case must
 * be self-contained: an arbiter who has to ask for context costs more and decides
 * slower. They see evidence, never thresholds or weights.
 */

import type { CaseStatus, DetectionOutcome, RedFlag, ReviewCase, Suspect } from "../types.js";

export interface ArbiterDecision {
  readonly caseId: string;
  readonly arbiterId: string;
  readonly upheld: boolean;
  readonly confidence: number;
  readonly reasoning: string;
  readonly decidedAt: Date;
}

export interface ArbiterPacket {
  readonly caseId: string;
  /** Anonymised — an arbiter judges moves, not people. */
  readonly anonymisedSuspectRef: string;
  readonly games: readonly string[];
  readonly evidence: readonly string[];
  readonly suspectStatement?: string;
}

export class CaseManager {
  openCase(
    suspect: Suspect,
    outcomes: readonly DetectionOutcome[],
    flags: readonly RedFlag[]
  ): Promise<ReviewCase> {
    throw new Error("Not implemented");
  }

  getCase(caseId: string): Promise<ReviewCase | null> {
    throw new Error("Not implemented");
  }

  listCases(status?: CaseStatus): Promise<readonly ReviewCase[]> {
    throw new Error("Not implemented");
  }

  /** Not every case needs a paid arbiter. Where the line sits is a policy value. */
  requiresHumanReview(reviewCase: ReviewCase): Promise<boolean> {
    throw new Error("Not implemented");
  }

  assignArbiter(caseId: string, arbiterId: string): Promise<ReviewCase> {
    throw new Error("Not implemented");
  }

  /** Anonymises the suspect and strips internal methodology. */
  prepareArbiterPacket(caseId: string): Promise<ArbiterPacket> {
    throw new Error("Not implemented");
  }

  recordDecision(decision: ArbiterDecision): Promise<ReviewCase> {
    throw new Error("Not implemented");
  }

  /** Cheap and high-value: "I was streaming, here's the VOD" resolves cases statistics get wrong. */
  submitSuspectStatement(caseId: string, userId: string, statement: string): Promise<ReviewCase> {
    throw new Error("Not implemented");
  }

  closeCase(caseId: string, notes: string): Promise<ReviewCase> {
    throw new Error("Not implemented");
  }
}
