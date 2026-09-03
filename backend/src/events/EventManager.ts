/**
 * Dispatches platform events to the actions registered against them.
 *
 * EventManager (this class)
 *   reads  TriggerActionRow[]  — the trigger/action table (triggerActions.ts)
 *   holds  ActionHandler       — one per action, registered by the owning domain
 *   emits  EventPayload        — supplied by whichever domain raised the event
 *
 * Lives outside `anticheat/` because other domains will consume these events
 * too. See ./README.md.
 */

import { reportError } from "../realtime/observability/index.js";
import { TRIGGER_ACTIONS } from "./triggerActions.js";
import type {
  ActionHandler,
  ActionId,
  EventPayload,
  TriggerActionRow,
} from "./types.js";

/**
 * Actions do engine work, and the process holds a single serialised Stockfish,
 * so running two at once only interleaves them.
 */
const DEFAULT_MAX_CONCURRENT_ACTIONS = 1;

/** One action waiting to run, paired with the event that queued it. */
interface QueuedAction {
  readonly actionId: ActionId;
  readonly handler: ActionHandler;
  readonly event: EventPayload;
}

export class EventManager {
  /** Registered handler per action id. An action with no handler never runs. */
  private readonly actionHandlers = new Map<ActionId, ActionHandler>();

  /** Actions queued but not yet started. */
  private readonly actionQueue: QueuedAction[] = [];

  /** Actions currently in flight, capped by maxConcurrentActions. */
  private runningActionCount = 0;

  constructor(
    private readonly triggerActions: readonly TriggerActionRow[],
    private readonly maxConcurrentActions = DEFAULT_MAX_CONCURRENT_ACTIONS
  ) {}

  registerAction(actionId: ActionId, handler: ActionHandler): void {
    this.actionHandlers.set(actionId, handler);
  }

  /**
   * Returns immediately and never throws. Emitters are game paths — nothing
   * here may delay a move, hold a clock, or change a result.
   */
  emit(event: EventPayload): void {
    this.queueActionsFor(event);
    this.runQueuedActions();
  }

  hasAction(actionId: ActionId): boolean {
    return this.actionHandlers.has(actionId);
  }

  /** Actions queued or in flight. For tests and diagnostics. */
  getPendingActionCount(): number {
    return this.actionQueue.length + this.runningActionCount;
  }

  /** Queues every enabled action the table maps to this event's trigger. */
  private queueActionsFor(event: EventPayload): void {
    for (const row of this.triggerActions) {
      if (!row.enabled || row.trigger !== event.trigger) continue;

      const handler = this.actionHandlers.get(row.action);
      if (!handler) {
        // A row may legitimately name an action nobody has registered yet.
        console.warn(`[events] No handler registered for action '${row.action}'.`);
        continue;
      }
      this.actionQueue.push({ actionId: row.action, handler, event });
    }
  }

  private runQueuedActions(): void {
    while (
      this.runningActionCount < this.maxConcurrentActions &&
      this.actionQueue.length > 0
    ) {
      this.startAction(this.actionQueue.shift()!);
    }
  }

  private startAction(queued: QueuedAction): void {
    this.runningActionCount++;

    // Promise.resolve().then() so a handler that throws synchronously is
    // isolated exactly like one that rejects.
    void Promise.resolve()
      .then(() => queued.handler(queued.event))
      .catch((error: unknown) => this.reportActionFailure(queued, error))
      .finally(() => {
        this.runningActionCount--;
        this.runQueuedActions();
      });
  }

  private reportActionFailure(queued: QueuedAction, error: unknown): void {
    reportError({
      domain: "events",
      error: error as Error,
      fatal: false,
      context: { actionId: queued.actionId, trigger: queued.event.trigger },
    });
  }
}

/** Process-wide instance. Domains register their actions against this at boot. */
export const eventManager = new EventManager(TRIGGER_ACTIONS);
