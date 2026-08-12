import { matchmakingQueue } from "./MatchmakingQueue.js";

/**
 * 30-second interval ticker driving ticket expiry, MATCHED pruning, and pairing checks.
 */
export class ExpiryTicker {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly intervalMs: number = 30_000) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      matchmakingQueue.expireStale();
      matchmakingQueue.pruneMatched();
      matchmakingQueue.tryPair();
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
