/**
 * Dispatches platform events to actions via the trigger/action table.
 * Outside `anticheat/` because other domains will consume these events too.
 */

import { reportError } from "../observability/index.js";
import { TRIGGER_ACTIONS } from "./triggerActions.js";
import type {
  ActionHandler,
  ActionId,
  EventPayload,
  TriggerActionRow,
} from "./types.js";

interface QueuedAction {
  readonly action: ActionId;
  readonly handler: ActionHandler;
  readonly event: EventPayload;
}

export class EventManager {
  private readonly handlers = new Map<ActionId, ActionHandler>();
  private readonly queue: QueuedAction[] = [];
  private running = 0;

  /**
   * Concurrency defaults to 1: actions do engine work and the process holds a
   * single serialised Stockfish, so running two at once only interleaves them.
   */
  constructor(
    private readonly rows: readonly TriggerActionRow[],
    private readonly concurrency = 1
  ) {}

  register(action: ActionId, handler: ActionHandler): void {
    this.handlers.set(action, handler);
  }

  /**
   * Returns immediately and never throws. Emitters are game paths — nothing
   * here may delay a move, hold a clock, or change a result.
   */
  emit(event: EventPayload): void {
    for (const row of this.rows) {
      if (!row.enabled || row.trigger !== event.trigger) continue;

      const handler = this.handlers.get(row.action);
      if (!handler) {
        // A row may legitimately name an action nobody has registered yet.
        console.warn(`[events] No handler registered for action '${row.action}'.`);
        continue;
      }
      this.queue.push({ action: row.action, handler, event });
    }
    this.drain();
  }

  /** Queue depth, for tests and diagnostics. */
  get pending(): number {
    return this.queue.length + this.running;
  }

  private drain(): void {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.running++;

      // Promise.resolve().then() so a handler that throws synchronously is
      // isolated exactly like one that rejects.
      void Promise.resolve()
        .then(() => job.handler(job.event))
        .catch((err: unknown) => {
          reportError({
            domain: "events",
            error: err as Error,
            fatal: false,
            context: { action: job.action, trigger: job.event.trigger },
          });
        })
        .finally(() => {
          this.running--;
          this.drain();
        });
    }
  }
}

/** Process-wide instance. Domains register their actions against this at boot. */
export const eventManager = new EventManager(TRIGGER_ACTIONS);
