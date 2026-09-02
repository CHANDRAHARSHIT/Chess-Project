/**
 * DB↔domain boundary for review cases. Every Prisma call lives here, so
 * CaseManager can run against an in-memory repository in tests.
 */

import type { Prisma, ReviewCase as ReviewCaseRow } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import {
  UNRESOLVED_CASE_STATUSES,
  type CaseStatus,
  type DetectionOutcome,
  type ReviewCase,
  type Situation,
} from "../types.js";

/** Everything needed to open a case. The id is assigned by the database. */
export interface NewCaseInput {
  readonly userId: string;
  readonly situation: Situation;
  readonly outcome: DetectionOutcome;
}

/** Partial update. Only the fields a caller names are written. */
export interface CaseChanges {
  readonly status?: CaseStatus;
  readonly outcomes?: readonly DetectionOutcome[];
  readonly evidence?: readonly string[];
  readonly flaggedGameRecordIds?: readonly string[];
  readonly assignedArbiterId?: string;
  readonly resolvedAt?: Date;
  readonly resolutionNotes?: string;
  readonly upheld?: boolean;
  readonly arbiterConfidence?: number;
  readonly suspectStatement?: string;
  readonly appealStatus?: string;
  readonly appealGrounds?: string;
  readonly appealedAt?: Date;
  readonly appealDecidedAt?: Date;
  readonly appealDecisionReasoning?: string;
}

export interface CaseRepository {
  saveCase(input: NewCaseInput): Promise<ReviewCase>;
  findCaseById(caseId: string): Promise<ReviewCase | null>;
  findCases(status?: CaseStatus): Promise<readonly ReviewCase[]>;
  /** The open case a new detection should append to, if one exists. */
  findUnresolvedCaseForUser(userId: string): Promise<ReviewCase | null>;
  updateCase(caseId: string, changes: CaseChanges): Promise<ReviewCase>;
  /** Drives the escalation level, which is derived rather than stored. */
  countUpheldCases(userId: string): Promise<number>;
}

export const prismaCaseRepository: CaseRepository = {
  async saveCase(input: NewCaseInput): Promise<ReviewCase> {
    const row = await prisma.reviewCase.create({
      data: {
        userId: input.userId,
        proficiency: input.situation.proficiency,
        eventType: input.situation.eventType,
        outcomes: [input.outcome] as unknown as Prisma.InputJsonValue,
        evidence: collectEvidence([input.outcome]) as unknown as Prisma.InputJsonValue,
        flaggedGameRecordIds: [...input.outcome.flaggedGameRecordIds],
      },
    });
    return buildReviewCase(row);
  },

  async findCaseById(caseId: string): Promise<ReviewCase | null> {
    const row = await prisma.reviewCase.findUnique({ where: { id: caseId } });
    return row ? buildReviewCase(row) : null;
  },

  async findCases(status?: CaseStatus): Promise<readonly ReviewCase[]> {
    const rows = await prisma.reviewCase.findMany({
      where: status ? { status } : undefined,
      orderBy: { openedAt: "desc" },
    });
    return rows.map(buildReviewCase);
  },

  async findUnresolvedCaseForUser(userId: string): Promise<ReviewCase | null> {
    const row = await prisma.reviewCase.findFirst({
      where: { userId, status: { in: [...UNRESOLVED_CASE_STATUSES] } },
      orderBy: { openedAt: "desc" },
    });
    return row ? buildReviewCase(row) : null;
  },

  async updateCase(caseId: string, changes: CaseChanges): Promise<ReviewCase> {
    const row = await prisma.reviewCase.update({
      where: { id: caseId },
      data: buildUpdateData(changes),
    });
    return buildReviewCase(row);
  },

  async countUpheldCases(userId: string): Promise<number> {
    return prisma.reviewCase.count({ where: { userId, upheld: true } });
  },
};

/** Every check's evidence across every outcome, de-duplicated but order-preserving. */
export function collectEvidence(outcomes: readonly DetectionOutcome[]): string[] {
  const evidence = new Set<string>();
  for (const outcome of outcomes) {
    for (const result of outcome.results) {
      for (const line of result.evidence) evidence.add(line);
    }
  }
  return [...evidence];
}

/** Casts are safe because only this module writes these JSON columns. */
function buildReviewCase(row: ReviewCaseRow): ReviewCase {
  const outcomes = (row.outcomes ?? []) as unknown as DetectionOutcome[];

  return {
    caseId: row.id,
    suspect: {
      userId: row.userId,
      ratingAtEvent: outcomes[0]?.suspect.ratingAtEvent ?? null,
      proficiency: row.proficiency as ReviewCase["situation"]["proficiency"],
      priorStrikeCount: 0,
      underHeightenedScrutiny: false,
    },
    situation: {
      proficiency: row.proficiency as ReviewCase["situation"]["proficiency"],
      eventType: row.eventType as ReviewCase["situation"]["eventType"],
    },
    status: row.status as CaseStatus,
    outcomes: outcomes.map(reviveOutcome),
    evidence: (row.evidence ?? []) as unknown as string[],
    flaggedGameRecordIds: row.flaggedGameRecordIds,
    // Compensation computes these when the case is upheld; never stored.
    affectedUsers: [],
    openedAt: row.openedAt,
    ...optional("assignedArbiterId", row.assignedArbiterId),
    ...optional("resolvedAt", row.resolvedAt),
    ...optional("resolutionNotes", row.resolutionNotes),
    ...optional("upheld", row.upheld),
    ...optional("arbiterConfidence", row.arbiterConfidence),
    ...optional("suspectStatement", row.suspectStatement),
    ...buildAppeal(row),
  };
}

/** `evaluatedAt` survives JSON as a string; the domain type promises a Date. */
function reviveOutcome(outcome: DetectionOutcome): DetectionOutcome {
  return { ...outcome, evaluatedAt: new Date(outcome.evaluatedAt) };
}

function buildAppeal(row: ReviewCaseRow): { appeal?: ReviewCase["appeal"] } {
  if (!row.appealStatus || !row.appealedAt) return {};

  return {
    appeal: {
      status: row.appealStatus as NonNullable<ReviewCase["appeal"]>["status"],
      grounds: row.appealGrounds ?? "",
      submittedAt: row.appealedAt,
      ...optional("decidedAt", row.appealDecidedAt),
      ...optional("decisionReasoning", row.appealDecisionReasoning),
    },
  };
}

/** Keeps nulls out of optional fields, which the domain types declare as absent. */
function optional<K extends string, V>(key: K, value: V | null): Record<K, V> | Record<string, never> {
  return value === null || value === undefined ? {} : ({ [key]: value } as Record<K, V>);
}

function buildUpdateData(changes: CaseChanges): Prisma.ReviewCaseUpdateInput {
  const { outcomes, evidence, flaggedGameRecordIds, ...scalars } = changes;

  return {
    ...scalars,
    ...(outcomes ? { outcomes: outcomes as unknown as Prisma.InputJsonValue } : {}),
    ...(evidence ? { evidence: evidence as unknown as Prisma.InputJsonValue } : {}),
    ...(flaggedGameRecordIds ? { flaggedGameRecordIds: [...flaggedGameRecordIds] } : {}),
  };
}
