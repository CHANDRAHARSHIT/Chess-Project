import type { SessionManager } from "./SessionManager.js";

/**
 * Interval ticker that drives clock updates for active sessions.
 * Default interval: 100ms.
 */
export class ClockTicker {
  private timer: NodeJS.Timeout | null = null;
  private lastTickAt: number = Date.now();

  constructor(
    private readonly sessionManager: SessionManager,
    private readonly intervalMs: number = 100
  ) {}

  start(): void {
    if (this.timer) return;
    this.lastTickAt = Date.now();
    this.timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.max(0, now - this.lastTickAt);
      this.lastTickAt = now;
      this.sessionManager.tickClocks(elapsed);
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
