/**
 * The self-correction loop. Reviews both the detector (via simulation) and the
 * public Fair Play docs (via user feedback).
 *
 * proposePolicyAdjustments only *proposes*. A system that retunes its own ban
 * thresholds unattended drifts invisibly, because the same system grades itself.
 * A human approves; PolicyRegistry records who.
 */

import type { CheckId, Situation } from "../types.js";
import type { MetricsReport } from "../simulation/DetectionMetrics.js";
import type { PolicyRegistry } from "./PolicyRegistry.js";

export interface PolicyProposal {
  readonly proposalId: string;
  readonly key: string;
  readonly situation: Situation;
  readonly currentValue: unknown;
  readonly proposedValue: unknown;
  readonly evidenceRunId: string;
  readonly expectedImpact: string;
  readonly proposedAt: Date;
}

export interface DocumentFeedback {
  readonly documentId: string;
  readonly userId?: string;
  /** 1–5 scales. */
  readonly clarity: number;
  readonly relevance: number;
  readonly usefulness: number;
  readonly comment?: string;
  readonly submittedAt: Date;
}

export class EffectivenessReview {
  constructor(private readonly policy: PolicyRegistry) {}

  proposePolicyAdjustments(runId: string): Promise<readonly PolicyProposal[]> {
    throw new Error("Not implemented");
  }

  approveProposal(proposalId: string, approvedBy: string): Promise<void> {
    throw new Error("Not implemented");
  }

  identifyUnderperformingChecks(runId: string): Promise<readonly CheckId[]> {
    throw new Error("Not implemented");
  }

  /** Catches slow decay: nothing breaks, the detector just quietly gets worse. */
  detectDegradation(situation: Situation): Promise<MetricsReport | null> {
    throw new Error("Not implemented");
  }

  recordDocumentFeedback(feedback: DocumentFeedback): Promise<void> {
    throw new Error("Not implemented");
  }

  summariseDocumentFeedback(documentId: string): Promise<Readonly<Record<string, number>>> {
    throw new Error("Not implemented");
  }

  /**
   * Strongest real-world calibration signal available: appeals upheld on
   * high-confidence cases mean the detector's confidence is untrustworthy, and
   * simulation alone will never reveal that.
   */
  reviewAppealOutcomes(situation: Situation): Promise<Readonly<Record<string, number>>> {
    throw new Error("Not implemented");
  }
}
