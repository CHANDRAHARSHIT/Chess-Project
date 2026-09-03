/**
 * Reads the PenaltyAction catalogue. Adding a consequence is a row here, not a
 * code change — which is why the blocking set and the durations are read rather
 * than hardcoded.
 */

import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import type { PenaltyAction } from "../types.js";

export interface PenaltyActionType {
  readonly code: PenaltyAction;
  readonly label: string;
  readonly description: string;
  readonly blocksPlay: boolean;
  readonly defaultDurationMs: number | null;
  readonly isImplemented: boolean;
  readonly isActive: boolean;
  readonly sortOrder: number;
}

export interface ActionRepository {
  findActiveActions(): Promise<readonly PenaltyActionType[]>;
  findActionByCode(code: PenaltyAction): Promise<PenaltyActionType | null>;
  findBlockingCodes(): Promise<readonly PenaltyAction[]>;
}

export function createPrismaActionRepository(
  client: Prisma.TransactionClient = prisma
): ActionRepository {
  return {
    async findActiveActions(): Promise<readonly PenaltyActionType[]> {
      const rows = await client.penaltyAction.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      return rows.map(buildActionType);
    },

    async findActionByCode(code: PenaltyAction): Promise<PenaltyActionType | null> {
      const row = await client.penaltyAction.findUnique({ where: { code } });
      return row ? buildActionType(row) : null;
    },

    async findBlockingCodes(): Promise<readonly PenaltyAction[]> {
      const rows = await client.penaltyAction.findMany({
        where: { isActive: true, blocksPlay: true },
        select: { code: true },
      });
      return rows.map((row) => row.code as PenaltyAction);
    },
  };
}

export const prismaActionRepository: ActionRepository = createPrismaActionRepository();

function buildActionType(row: {
  code: string;
  label: string;
  description: string;
  blocksPlay: boolean;
  defaultDurationMs: bigint | null;
  isImplemented: boolean;
  isActive: boolean;
  sortOrder: number;
}): PenaltyActionType {
  return {
    code: row.code as PenaltyAction,
    label: row.label,
    description: row.description,
    blocksPlay: row.blocksPlay,
    defaultDurationMs: row.defaultDurationMs === null ? null : Number(row.defaultDurationMs),
    isImplemented: row.isImplemented,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}
