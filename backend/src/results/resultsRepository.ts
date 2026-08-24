/**
 * Results Repository — the actual database writer.
 *
 * Owns the single Prisma transaction that persists a terminal GameResult:
 * one GameRecord, its GameParticipant rows, and (for eligible rated 2-player
 * games) a PlayerRating update per side.
 *
 * NEVER throws — every failure is caught internally and reported via
 * reportError(). See resultsListener.ts for why that guarantee matters.
 */

import { prisma } from "../core/database/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import type { GameResult, ResultOutcome } from "../contracts/index.js";
import { reportError } from "../observability/index.js";
import { DEFAULT_RATING, ELO_SCORE, computeEloDelta, kFactorFor } from "./ratingService.js";

const MAX_RATING_RETRY_ATTEMPTS = 3;

/** Thrown internally when a PlayerRating compare-and-swap loses a race; triggers a full retry. */
class RatingConcurrencyConflictError extends Error {
  constructor() {
    super("PlayerRating optimistic concurrency conflict — retrying.");
  }
}

/** Only 2-player, rated, non-abort games get a rating update — see m4_implementation_plan.md §2. */
function isRatingEligible(result: GameResult): boolean {
  return result.rated && result.terminationReason !== "abort" && result.participants.length === 2;
}

function winningSideOf(outcome: ResultOutcome): number | null {
  return outcome.kind === "win" ? outcome.winningSide : null;
}

function participantResultOf(outcome: ResultOutcome, side: number): "WIN" | "LOSS" | "DRAW" {
  if (outcome.kind === "draw") return "DRAW";
  return outcome.winningSide === side ? "WIN" : "LOSS";
}

function scoreFor(outcome: ResultOutcome, side: number): number {
  if (outcome.kind === "draw") return ELO_SCORE.DRAW;
  return outcome.winningSide === side ? ELO_SCORE.WIN : ELO_SCORE.LOSS;
}

export async function persistGameResult(result: GameResult): Promise<void> {
  if (result.rated && result.terminationReason !== "abort" && result.participants.length !== 2) {
    reportError({
      domain: "results",
      error: new Error(
        `Rated game with ${result.participants.length} participants — rating computation only supports 2-player games today. Persisting history without a rating update.`
      ),
      fatal: false,
      context: { gameSessionId: result.gameSessionId, matchId: result.matchId },
    });
  }

  const ratingEligible = isRatingEligible(result);

  for (let attempt = 1; attempt <= MAX_RATING_RETRY_ATTEMPTS; attempt++) {
    try {
      await prisma.$transaction(async (tx) => {
        const ratingUpdates = ratingEligible ? await applyRatingUpdates(tx, result) : null;

        await tx.gameRecord.create({
          data: {
            gameSessionId: result.gameSessionId,
            matchId: result.matchId,
            variantId: result.variantId,
            rated: result.rated,
            provenance: result.provenance,
            outcomeKind: result.outcome.kind,
            winningSide: winningSideOf(result.outcome),
            terminationReason: result.terminationReason,
            moveCount: result.moveCount,
            moveHistory: (result.moveHistory as Prisma.InputJsonValue) ?? undefined,
            initialSeconds: result.timeControl?.initialSeconds,
            incrementSeconds: result.timeControl?.incrementSeconds,
            timeControlLabel: result.timeControl?.label,
            ratingPoolId: result.ratingPoolId,
            tournamentContext: (result.tournamentContext as Prisma.InputJsonValue) ?? undefined,
            metadata: (result.metadata as Prisma.InputJsonValue) ?? undefined,
            durationSeconds: result.durationSeconds,
            endedAt: new Date(result.endedAt),
            participants: {
              create: result.participants.map((p) => {
                const update = ratingUpdates?.get(p.userId);
                return {
                  userId: p.userId,
                  side: p.side,
                  result: participantResultOf(result.outcome, p.side),
                  ratingBefore: update?.before,
                  ratingAfter: update?.after,
                  ratingDelta: update?.delta,
                };
              }),
            },
          },
        });
      });

      return;
    } catch (err) {
      if (err instanceof RatingConcurrencyConflictError) {
        if (attempt < MAX_RATING_RETRY_ATTEMPTS) continue;
        reportError({
          domain: "results",
          error: err,
          fatal: true,
          context: { gameSessionId: result.gameSessionId, reason: "rating_concurrency_exhausted" },
        });
        return;
      }

      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // Benign duplicate. SessionManager's resultEmitted guard should make this unreachable
        // in practice — these unique constraints (gameSessionId, matchId) exist as insurance,
        // not because a duplicate is expected. Not fatal.
        reportError({
          domain: "results",
          error: err,
          fatal: false,
          context: { gameSessionId: result.gameSessionId, reason: "duplicate_game_result" },
        });
        return;
      }

      reportError({
        domain: "results",
        error: err,
        fatal: true,
        context: { gameSessionId: result.gameSessionId, matchId: result.matchId },
      });
      return;
    }
  }
}

/**
 * Reads, computes, and writes both sides' PlayerRating rows for a 2-player rated game via
 * optimistic-concurrency compare-and-swap. Throws RatingConcurrencyConflictError on a lost
 * race, which persistGameResult retries as a whole (nothing here partially commits — the
 * enclosing $transaction rolls back entirely on any throw).
 */
async function applyRatingUpdates(
  tx: Prisma.TransactionClient,
  result: GameResult
): Promise<Map<string, { before: number; after: number; delta: number }>> {
  const [a, b] = result.participants;

  const ratingA = await getOrCreatePlayerRating(tx, a.userId, result.variantId);
  const ratingB = await getOrCreatePlayerRating(tx, b.userId, result.variantId);

  const deltaA = computeEloDelta(
    ratingA.rating,
    ratingB.rating,
    scoreFor(result.outcome, a.side),
    kFactorFor(ratingA.gamesPlayed)
  );
  const deltaB = computeEloDelta(
    ratingB.rating,
    ratingA.rating,
    scoreFor(result.outcome, b.side),
    kFactorFor(ratingB.gamesPlayed)
  );

  await casUpdatePlayerRating(tx, ratingA, deltaA);
  await casUpdatePlayerRating(tx, ratingB, deltaB);

  return new Map([
    [a.userId, { before: ratingA.rating, after: ratingA.rating + deltaA, delta: deltaA }],
    [b.userId, { before: ratingB.rating, after: ratingB.rating + deltaB, delta: deltaB }],
  ]);
}

async function getOrCreatePlayerRating(tx: Prisma.TransactionClient, userId: string, variantId: string) {
  await tx.playerRating.upsert({
    where: { userId_variantId: { userId, variantId } },
    update: {},
    create: { userId, variantId, rating: DEFAULT_RATING, gamesPlayed: 0, version: 0 },
  });
  return tx.playerRating.findUniqueOrThrow({ where: { userId_variantId: { userId, variantId } } });
}

async function casUpdatePlayerRating(
  tx: Prisma.TransactionClient,
  current: { id: string; version: number },
  delta: number
): Promise<void> {
  const { count } = await tx.playerRating.updateMany({
    where: { id: current.id, version: current.version },
    data: { rating: { increment: delta }, gamesPlayed: { increment: 1 }, version: { increment: 1 } },
  });
  if (count === 0) throw new RatingConcurrencyConflictError();
}
