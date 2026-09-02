/**
 * Platform event vocabulary — the two columns of the trigger/action table.
 * See ./README.md.
 */

export type TriggerType =
  | "post_game"
  | "post_tournament"
  | "after_move_unrated"
  | "after_move_rated";

/** Widened, not a union: actions must be addable without a code change. */
export type ActionId = string;

export interface PostGameEvent {
  readonly trigger: "post_game";
  readonly gameSessionId: string;
}

/** Gains one member per trigger, as each gets a real emitter. */
export type EventPayload = PostGameEvent;

/** One row: "when trigger Y happens, run action X". */
export interface TriggerActionRow {
  readonly trigger: TriggerType;
  readonly action: ActionId;
  readonly enabled: boolean;
}

export type ActionHandler = (event: EventPayload) => void | Promise<void>;
