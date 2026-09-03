/**
 * Admin and appellant HTTP surface for the ACS.
 *
 * Enforcement is automatic; these routes exist to see what the system did and to
 * reverse it. Responses carry evidence, never scores, thresholds or weights — a
 * published threshold becomes a target.
 */

import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { CaseManager } from "./review/CaseManager.js";
import {
  CaseAccessError,
  CaseAlreadyAppealedError,
  CaseAlreadyResolvedError,
  CaseNotDecidedError,
  CaseNotFoundError,
} from "./review/CaseManager.js";
import { createPrismaCaseRepository } from "./review/caseRepository.js";
import { PenaltyManager } from "./penalty/PenaltyManager.js";
import { createPrismaPenaltyRepository } from "./penalty/penaltyRepository.js";
import { EscalationLadder } from "./penalty/EscalationLadder.js";
import { CompensationManager } from "./compensation/CompensationManager.js";
import { createPrismaCompensationRepository } from "./compensation/compensationRepository.js";
import { PolicyRegistry } from "./feedback/PolicyRegistry.js";
import type { AppliedPenalty, CaseStatus, PenaltyAction, ReviewCase } from "./types.js";

const PENALTY_ACTIONS: readonly PenaltyAction[] = [
  "increase_monitoring",
  "warning",
  "strike",
  "restrict_from_prize_events",
  "restrict_from_rated_events",
  "suspend_from_current_event",
  "temporary_ban",
  "permanent_ban",
];

const CASE_STATUSES: readonly CaseStatus[] = [
  "open",
  "awaiting_review",
  "under_review",
  "upheld",
  "overturned",
  "appealed",
  "closed",
];

/** Case list for admins. Summaries only; detail is a separate call. */
export async function listCases(req: Request, res: Response): Promise<void> {
  if (isDisabled(res)) return;

  const status = req.query.status;
  if (typeof status === "string" && !CASE_STATUSES.includes(status as CaseStatus)) {
    res.status(400).json({ status: "fail", message: `Unknown case status '${status}'.` });
    return;
  }

  const cases = await new CaseManager().listCases(status as CaseStatus | undefined);
  res.status(200).json({ status: "success", data: cases.map(buildCaseSummary) });
}

/** Full detail for one case, for an admin deciding whether to reverse it. */
export async function getCase(req: Request, res: Response): Promise<void> {
  if (isDisabled(res)) return;

  const caseId = req.params.caseId;
  if (!caseId) {
    res.status(400).json({ status: "fail", message: "A case ID must be provided." });
    return;
  }

  try {
    const reviewCase = await new CaseManager().getCase(caseId);
    if (!reviewCase) {
      res.status(404).json({ status: "fail", message: `Case '${caseId}' not found.` });
      return;
    }
    res.status(200).json({ status: "success", data: buildCaseDetail(reviewCase) });
  } catch (error) {
    respondToCaseError(error, res);
  }
}

/**
 * Records an admin's decision on a case. Upholding applies the penalties they
 * chose and compensates the affected users; overturning records the reversal.
 *
 * All writes share one transaction: a compensation failure must not leave the
 * user penalised with no record of who was owed what.
 */
export async function resolveCase(req: Request, res: Response): Promise<void> {
  if (isDisabled(res)) return;

  const caseId = req.params.caseId;
  const { upheld, confidence, reasoning, actions } = req.body ?? {};
  const decidedBy = req.user?.email ?? "unknown-admin";

  const invalid = findResolveRequestError(caseId, upheld, confidence, reasoning, actions);
  if (invalid) {
    res.status(400).json({ status: "fail", message: invalid });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cases = new CaseManager(createPrismaCaseRepository(tx));
      const resolved = await cases.recordDecision({
        caseId: caseId!,
        decidedBy,
        upheld,
        confidence,
        reasoning,
        decidedAt: new Date(),
      });

      if (!resolved.upheld) return { case: resolved, penalties: [], compensations: [] };

      return {
        case: resolved,
        penalties: await applyPenalties(tx, cases, resolved, actions ?? []),
        compensations: await new CompensationManager(
          createPrismaCompensationRepository(tx)
        ).compensate(resolved),
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        case: buildCaseSummary(result.case),
        penaltiesApplied: result.penalties.map((penalty) => penalty.action),
        usersCompensated: result.compensations.length,
      },
    });
  } catch (error) {
    respondToCaseError(error, res);
  }
}

/** The suspect's own appeal against a decided case. */
export async function appealCase(req: Request, res: Response): Promise<void> {
  if (isDisabled(res)) return;

  const caseId = req.params.caseId;
  const userId = req.user?.id;
  const grounds = req.body?.grounds;

  if (!userId) {
    res.status(401).json({ status: "fail", message: "Unauthorized. Please sign in." });
    return;
  }
  if (!caseId || typeof grounds !== "string" || grounds.trim() === "") {
    res.status(400).json({ status: "fail", message: "A case ID and grounds are required." });
    return;
  }

  try {
    const appealed = await new CaseManager().submitAppeal(caseId, userId, grounds);
    res.status(200).json({ status: "success", data: buildAppellantView(appealed) });
  } catch (error) {
    respondToCaseError(error, res);
  }
}

async function applyPenalties(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  cases: CaseManager,
  resolved: ReviewCase,
  actions: PenaltyAction[]
): Promise<AppliedPenalty[]> {
  const policy = new PolicyRegistry();
  const ladder = new EscalationLadder(policy, cases);
  const penalties = new PenaltyManager(policy, ladder, createPrismaPenaltyRepository(tx));
  const level = await ladder.getLevel(resolved.suspect.userId, resolved.situation);

  const applied: AppliedPenalty[] = [];
  for (const action of actions) {
    applied.push(
      await penalties.apply(
        resolved.suspect.userId,
        action,
        resolved.caseId,
        resolved.situation,
        level
      )
    );
  }
  return applied;
}

function findResolveRequestError(
  caseId: string | undefined,
  upheld: unknown,
  confidence: unknown,
  reasoning: unknown,
  actions: unknown
): string | null {
  if (!caseId) return "A case ID must be provided.";
  if (typeof upheld !== "boolean") return "'upheld' must be a boolean.";
  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) {
    return "'confidence' must be a number between 0 and 1.";
  }
  if (typeof reasoning !== "string" || reasoning.trim() === "") {
    return "'reasoning' is required.";
  }
  if (actions !== undefined) {
    if (!Array.isArray(actions)) return "'actions' must be an array.";
    const unknownAction = actions.find((action) => !PENALTY_ACTIONS.includes(action));
    if (unknownAction) return `Unknown penalty action '${unknownAction}'.`;
  }
  return null;
}

/** Queue row. Deliberately omits outcomes, scores and thresholds. */
function buildCaseSummary(reviewCase: ReviewCase) {
  return {
    caseId: reviewCase.caseId,
    status: reviewCase.status,
    openedAt: reviewCase.openedAt,
    flaggedGameCount: reviewCase.flaggedGameRecordIds.length,
    detectionCount: reviewCase.outcomes.length,
    ...(reviewCase.decidedById ? { decidedById: reviewCase.decidedById } : {}),
    ...(reviewCase.resolvedAt ? { resolvedAt: reviewCase.resolvedAt } : {}),
    ...(reviewCase.upheld !== undefined ? { upheld: reviewCase.upheld } : {}),
  };
}

/** Evidence and flagged games, without scores, thresholds or weights. */
function buildCaseDetail(reviewCase: ReviewCase) {
  return {
    ...buildCaseSummary(reviewCase),
    userId: reviewCase.suspect.userId,
    flaggedGameRecordIds: reviewCase.flaggedGameRecordIds,
    evidence: reviewCase.evidence,
    ...(reviewCase.suspectStatement ? { suspectStatement: reviewCase.suspectStatement } : {}),
    ...(reviewCase.appeal ? { appeal: reviewCase.appeal } : {}),
  };
}

/** What was found and what follows — never scores, thresholds or evidence. */
function buildAppellantView(reviewCase: ReviewCase) {
  return {
    caseId: reviewCase.caseId,
    status: reviewCase.status,
    gamesReviewed: reviewCase.flaggedGameRecordIds.length,
    ...(reviewCase.appeal ? { appealStatus: reviewCase.appeal.status } : {}),
  };
}

function isDisabled(res: Response): boolean {
  if (env.ANTICHEAT_ENABLED) return false;

  res.status(503).json({ status: "fail", message: "The anti-cheat system is currently disabled." });
  return true;
}

function respondToCaseError(error: unknown, res: Response): void {
  if (error instanceof CaseNotFoundError) {
    res.status(404).json({ status: "fail", message: error.message });
    return;
  }
  if (error instanceof CaseAccessError) {
    res.status(403).json({ status: "fail", message: error.message });
    return;
  }
  if (
    error instanceof CaseAlreadyResolvedError ||
    error instanceof CaseNotDecidedError ||
    error instanceof CaseAlreadyAppealedError
  ) {
    res.status(409).json({ status: "fail", message: error.message });
    return;
  }
  throw error;
}
