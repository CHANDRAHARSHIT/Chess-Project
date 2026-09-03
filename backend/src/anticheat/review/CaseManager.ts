/**
 * Offender review. The spec marks this component `[TODO]` and hasn't written it
 * up, so this is derived from stated goals and the staffing model — expect it to
 * change once that section lands.
 *
 * Arbiters are external FIDE-qualified contractors paid per case, so a case must
 * be self-contained: an arbiter who has to ask for context costs more and decides
 * slower. They see evidence, never thresholds or weights.
 */

import {
  UNRESOLVED_CASE_STATUSES,
  type CaseStatus,
  type DetectionOutcome,
  type ReviewCase,
  type Suspect,
} from "../types.js";
import {
  collectEvidence,
  prismaCaseRepository,
  type CaseRepository,
} from "./caseRepository.js";

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
  constructor(private readonly repository: CaseRepository = prismaCaseRepository) {}

  /**
   * Opens a case, or appends to the one already open for this suspect — a second
   * detection must neither duplicate the case nor be discarded.
   */
  async openCase(suspect: Suspect, outcome: DetectionOutcome): Promise<ReviewCase> {
    const existing = await this.repository.findUnresolvedCaseForUser(suspect.userId);
    if (!existing) {
      return this.repository.saveCase({
        userId: suspect.userId,
        situation: outcome.situation,
        outcome,
      });
    }

    const outcomes = [...existing.outcomes, outcome];
    return this.repository.updateCase(existing.caseId, {
      outcomes,
      evidence: collectEvidence(outcomes),
      flaggedGameRecordIds: mergeGameRecordIds(
        existing.flaggedGameRecordIds,
        outcome.flaggedGameRecordIds
      ),
    });
  }

  async getCase(caseId: string): Promise<ReviewCase | null> {
    return this.repository.findCaseById(caseId);
  }

  async listCases(status?: CaseStatus): Promise<readonly ReviewCase[]> {
    return this.repository.findCases(status);
  }

  /** Every case needs a human while certainty is capped below every penalty bar. */
  async requiresHumanReview(_reviewCase: ReviewCase): Promise<boolean> {
    return true;
  }

  async assignArbiter(caseId: string, arbiterId: string): Promise<ReviewCase> {
    await this.loadUnresolvedCase(caseId);
    return this.repository.updateCase(caseId, {
      assignedArbiterId: arbiterId,
      status: "under_review",
    });
  }

  /** Anonymises the suspect and strips internal methodology. */
  async prepareArbiterPacket(caseId: string): Promise<ArbiterPacket> {
    const reviewCase = await this.loadCase(caseId);

    return {
      caseId: reviewCase.caseId,
      anonymisedSuspectRef: buildAnonymisedRef(reviewCase.caseId),
      games: reviewCase.flaggedGameRecordIds,
      evidence: reviewCase.evidence,
      ...(reviewCase.suspectStatement ? { suspectStatement: reviewCase.suspectStatement } : {}),
    };
  }

  /** The only path that concludes someone cheated. Does not consult certainty bars. */
  async recordDecision(decision: ArbiterDecision): Promise<ReviewCase> {
    await this.loadUnresolvedCase(decision.caseId);

    return this.repository.updateCase(decision.caseId, {
      status: decision.upheld ? "upheld" : "overturned",
      upheld: decision.upheld,
      arbiterConfidence: decision.confidence,
      assignedArbiterId: decision.arbiterId,
      resolvedAt: decision.decidedAt,
      resolutionNotes: decision.reasoning,
    });
  }

  /** Cheap and high-value: "I was streaming, here's the VOD" resolves cases statistics get wrong. */
  async submitSuspectStatement(
    caseId: string,
    userId: string,
    statement: string
  ): Promise<ReviewCase> {
    const reviewCase = await this.loadUnresolvedCase(caseId);
    if (reviewCase.suspect.userId !== userId) {
      throw new CaseAccessError("Only the suspect may add a statement to their own case.");
    }

    return this.repository.updateCase(caseId, { suspectStatement: statement });
  }

  /**
   * Only the suspect may appeal, and only a decided case — an open case has
   * nothing to appeal against yet.
   */
  async submitAppeal(caseId: string, userId: string, grounds: string): Promise<ReviewCase> {
    const reviewCase = await this.loadCase(caseId);
    if (reviewCase.suspect.userId !== userId) {
      throw new CaseAccessError("Only the suspect may appeal their own case.");
    }
    if (reviewCase.upheld === undefined) {
      throw new CaseNotDecidedError(`Case '${caseId}' has not been decided yet.`);
    }
    if (reviewCase.appeal) {
      throw new CaseAlreadyAppealedError(`Case '${caseId}' has already been appealed.`);
    }

    return this.repository.updateCase(caseId, {
      status: "appealed",
      appealStatus: "submitted",
      appealGrounds: grounds,
      appealedAt: new Date(),
    });
  }

  async closeCase(caseId: string, notes: string): Promise<ReviewCase> {
    await this.loadCase(caseId);
    return this.repository.updateCase(caseId, {
      status: "closed",
      resolvedAt: new Date(),
      resolutionNotes: notes,
    });
  }

  async countUpheldCases(userId: string): Promise<number> {
    return this.repository.countUpheldCases(userId);
  }

  private async loadCase(caseId: string): Promise<ReviewCase> {
    const reviewCase = await this.repository.findCaseById(caseId);
    if (!reviewCase) throw new CaseNotFoundError(`Case '${caseId}' not found.`);
    return reviewCase;
  }

  private async loadUnresolvedCase(caseId: string): Promise<ReviewCase> {
    const reviewCase = await this.loadCase(caseId);
    if (!UNRESOLVED_CASE_STATUSES.includes(reviewCase.status)) {
      throw new CaseAlreadyResolvedError(
        `Case '${caseId}' is '${reviewCase.status}' and can no longer be changed.`
      );
    }
    return reviewCase;
  }
}

export class CaseNotFoundError extends Error {}
export class CaseAlreadyResolvedError extends Error {}
export class CaseAccessError extends Error {}
export class CaseNotDecidedError extends Error {}
export class CaseAlreadyAppealedError extends Error {}

/** From the case id, never the user id — an arbiter must not recognise a suspect across cases. */
function buildAnonymisedRef(caseId: string): string {
  return `Suspect-${caseId.slice(-6).toUpperCase()}`;
}

function mergeGameRecordIds(
  existing: readonly string[],
  added: readonly string[]
): readonly string[] {
  return [...new Set([...existing, ...added])].sort();
}
