import crypto from "crypto";
import { prisma } from "../core/database/prisma.js";
import { matchmakingQueue } from "../matchmaking/index.js";
import type { SessionManager, GameSession } from "../session/index.js";
import type { ParticipantAssignment } from "../contracts/index.js";
import { reportError } from "../observability/index.js";

const BOT_EMAILS = [
  "bot1@xlchess.internal",
  "bot2@xlchess.internal",
  "bot3@xlchess.internal",
  "bot4@xlchess.internal",
  "bot5@xlchess.internal",
];

interface BotRecord {
  readonly userId: string;
  readonly name?: string;
  readonly image?: string;
  busy: boolean;
}

const bots = new Map<string, BotRecord>();          // userId -> roster entry
const botSessionByUserId = new Map<string, string>(); // userId -> sessionId, while allocated to a game
const pendingTimers = new Map<string, NodeJS.Timeout>(); // sessionId -> pending think-timer

/**
 * Loads the five permanent bot users and registers the match listener that gives a bot
 * presence in its session. Must be called after the matchmaking-session bridge is wired,
 * so a "bot" descriptor's session already exists by the time the listener below runs.
 */
export async function attachBot(sessionManager: SessionManager): Promise<boolean> {
  const users = await prisma.user.findMany({
    where: { email: { in: BOT_EMAILS } },
    select: { id: true, name: true, image: true },
  });

  if (users.length !== BOT_EMAILS.length) {
    reportError({
      domain: "bot",
      error: new Error(
        `Bot roster incomplete: found ${users.length} of ${BOT_EMAILS.length} expected bot users.`
      ),
      fatal: true,
      context: { foundCount: users.length, expectedCount: BOT_EMAILS.length },
    });
    return false;
  }

  bots.clear();
  for (const user of users) {
    bots.set(user.id, {
      userId: user.id,
      name: user.name ?? undefined,
      image: user.image ?? undefined,
      busy: false,
    });
  }

  matchmakingQueue.onMatch((descriptor) => {
    if (descriptor.provenance !== "bot") return;

    const botParticipant = descriptor.participants.find((p) => bots.has(p.userId));
    if (!botParticipant) return;

    const sessionId = sessionManager.getSessionIdForParticipant(botParticipant.userId);
    if (!sessionId) {
      releaseBot(botParticipant.userId);
      return;
    }

    botSessionByUserId.set(botParticipant.userId, sessionId);
    sessionManager.notifyParticipantConnected(sessionId, botParticipant.userId);
  });

  return true;
}

/** Returns an available bot's assignment and marks it busy, or null if none are free. */
export function acquireBot(): ParticipantAssignment | null {
  for (const bot of bots.values()) {
    if (!bot.busy) {
      bot.busy = true;
      // side is a placeholder — the queue's own side generation assigns the real value.
      return { userId: bot.userId, side: 0, name: bot.name, image: bot.image };
    }
  }
  return null;
}

/** Safe no-op for unknown/human IDs. Clears the bot's pending timer and session association. */
export function releaseBot(userId: string): void {
  const bot = bots.get(userId);
  if (!bot) return;

  const sessionId = botSessionByUserId.get(userId);
  if (sessionId) {
    const timer = pendingTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      pendingTimers.delete(sessionId);
    }
    botSessionByUserId.delete(userId);
  }

  bot.busy = false;
}

function getTurnParticipant(session: GameSession): ParticipantAssignment | undefined {
  const { turnOrder } = session.variant.getCardinality(session.matchDescriptor.variantParams);
  const turnSide = turnOrder[session.moveHistory.length % turnOrder.length];
  return session.matchDescriptor.participants.find((p) => p.side === turnSide);
}

/**
 * No-op unless the session has a cached bot on the move. Schedules exactly one delayed
 * move per session; the delayed callback revalidates session status, bot identity, and
 * turn before submitting, since the game may have moved on during the think delay.
 */
export function maybePlayBotTurn(sessionManager: SessionManager, sessionId: string): void {
  if (pendingTimers.has(sessionId)) return;

  const session = sessionManager.getSession(sessionId);
  if (!session) return;
  if (session.status !== "READY" && session.status !== "PLAYING") return;

  const turnParticipant = getTurnParticipant(session);
  if (!turnParticipant) return;

  const bot = bots.get(turnParticipant.userId);
  if (!bot) return;

  const botUserId = turnParticipant.userId;
  const delayMs = 800 + crypto.randomInt(0, 1201);

  const timer = setTimeout(() => {
    pendingTimers.delete(sessionId);
    playBotMove(sessionManager, sessionId, botUserId);
  }, delayMs);
  pendingTimers.set(sessionId, timer);
}

function playBotMove(sessionManager: SessionManager, sessionId: string, botUserId: string): void {
  if (botSessionByUserId.get(botUserId) !== sessionId) return;

  const session = sessionManager.getSession(sessionId);
  if (!session) return;
  if (session.status !== "READY" && session.status !== "PLAYING") return;

  const turnParticipant = getTurnParticipant(session);
  if (!turnParticipant || turnParticipant.userId !== botUserId) return;

  const moves = session.variant.legalMoves(session.currentState, turnParticipant.side);
  if (moves.length === 0) {
    reportError({
      domain: "bot",
      error: new Error("Bot has no legal moves available"),
      fatal: false,
      context: { sessionId, botUserId },
    });
    return;
  }

  const move = moves[crypto.randomInt(0, moves.length)];
  const result = sessionManager.submitMove(sessionId, botUserId, move);
  if (!result.legal) {
    reportError({
      domain: "bot",
      error: new Error(`Bot move rejected: ${result.reason}`),
      fatal: false,
      context: { sessionId, botUserId },
    });
  }
}
