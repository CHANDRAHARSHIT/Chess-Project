import { matchmakingQueue } from "./matchmaking-queue.js";

/**
 * ~1-second interval ticker driving ticket expiry, MATCHED pruning, and pairing checks.
 * Interval shortened from 30s (M1-AM-02) to ~1s under M7 so a stale-ticket bot-fallback
 * sweep can meet a ten-second fallback target.
 */
export class ExpiryTicker {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly intervalMs: number = 1_000) {}

  /**
   * onBotFallbackSweep: optional, composition-provided (M7). Invoked once per tick after
   * expiry/pruning/tryPair(), so human FCFS pairing always has priority within the same
   * sweep. ExpiryTicker has no knowledge of bots — a single generic hook, not a second ticker.
   */
  start(onBotFallbackSweep?: () => void): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      matchmakingQueue.expireStale();
      matchmakingQueue.pruneMatched();
      matchmakingQueue.tryPair();
      onBotFallbackSweep?.();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const expiryTicker = new ExpiryTicker();
