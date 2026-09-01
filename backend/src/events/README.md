# Event Manager

> **Status: design. No code yet.**
>
> Founder's instruction: *"You'll need to setup an event manager throughout
> xlchess that will trigger events… Keep the event manager outside the ACS since
> other parts of xlchess will use it as well."*

---

## 1. What it is

A platform-wide dispatcher built around one manually-defined table with two
columns:

| Trigger | Action |
|---|---|
| `post_game` | `blunder_analysis` |
| `post_game` | `whole_history_review` |
| … | … |

**A row means: when trigger Y happens, run action X.** The founder expects
roughly twenty to fifty triggers eventually, and a growing action list —
blunder analysis, missed-move analysis, opening analysis, and whatever comes
next.

Adding behaviour to the platform becomes adding a row, not editing a call site.

## 2. Why it lives outside `anticheat/`

Other domains will emit and consume these events. Anti-cheat is the first
consumer, not the owner. Putting the dispatcher inside the ACS would mean every
future consumer imports the anti-cheat module to receive a `post_game` event —
and would couple unrelated features to `ANTICHEAT_ENABLED`.

So: `backend/src/events/` is its own domain, depending on nothing but
`observability/`. The ACS registers *its* actions with it at boot.

## 3. Current table

Per the founder: *"For now, use this: Y is post game, X is run analysis on all
games… So for now, link everything to post game trigger by default."*

| Trigger | Action | Status |
|---|---|---|
| `post_game` | `blunder_analysis` | Implemented — currently called directly by `resultsListener` |
| `post_game` | `whole_history_review` | Specified in `anticheat/MULTI_GAME_REVIEW_REQUIREMENTS.md`, not built |
| `post_game` | `missed_move_analysis` | Not built |
| `post_game` | `opening_analysis` | Not built, and near-void under Chess960 |

Every action defaults to the `post_game` trigger until the founder defines
others.

## 4. Shape

```ts
type TriggerType =
  | "post_game"
  | "post_tournament"
  | "after_move_unrated"
  | "after_move_rated"
  // …grows to 20–50

type ActionId = string;  // widened, so actions are addable without a code change

interface TriggerActionRow {
  readonly trigger: TriggerType;
  readonly action: ActionId;
  readonly enabled: boolean;
}
```

`EventManager.emit(trigger, payload)` looks up every enabled row for that
trigger and dispatches to the registered handler for each action. Handlers
register themselves: `eventManager.register(actionId, handler)`.

### Dispatch rules

These are the same rules Session → Results and the ACS hooks already follow, and
they are not negotiable given what the actions do.

- **Fire-and-forget.** `emit()` returns immediately. It must never delay a move,
  hold a clock, or change a result.
- **Error isolation.** One action throwing must not affect the emitter or any
  other action on the same row set. Errors go to `reportError`, not upward.
- **Bounded concurrency.** Actions do engine work. Unbounded promise spawning on
  `post_game` would let a busy hour queue thousands of Stockfish evaluations
  behind one serialised engine. The dispatcher needs a work queue with a
  concurrency limit, not `void handler()`.
- **A missing handler is a warning, not a crash.** A row can name an action
  nobody has registered yet.

## 5. Where triggers are emitted

| Trigger | Emitted from | Exists today |
|---|---|---|
| `post_game` | `results/resultsListener` | Yes — currently calls `analyseOnGameCompleted` directly |
| `after_move_unrated` / `after_move_rated` | `session/SessionManager` | The seam exists; nothing emits |
| `post_tournament` | Tournament domain | No tournament domain exists |

The first migration is small and contained: `resultsListener` stops calling the
ACS directly and emits `post_game` instead, and the ACS registers
`blunder_analysis`. Behaviour is unchanged; the wiring moves.

## 6. Two collisions with the ACS to resolve

**6.1 The word "trigger" is already taken.** `anticheat/detection/TriggerScheduler.ts`
owns `TriggerPoint` and its own scheduling. Under the event manager it stops
deciding *when* things run and becomes the ACS-side adapter: it registers the
ACS's actions and builds the `AnalysisWindow` each one runs against. That is a
reduction in its scope, and it is unimplemented, so nothing breaks.

**6.2 Two places would encode "what runs when".** The founder's table separates
`after_move_rated` from `after_move_unrated`, which puts detection intensity —
risk-scaled monitoring — into the trigger table. `PolicyRegistry.getActiveTriggers(situation)`
was designed to hold exactly that.

Proposal: **the table owns dispatch, `PolicyRegistry` keeps thresholds.**
`getActiveTriggers` is then redundant and should be retired rather than left as
a second, disagreeing source of truth. This does not weaken the spec's
"no static rules" principle — the table is itself configuration, and moves to the
database in §7.

## 7. Storage

In-code for now (`triggerActions.ts`), matching the founder's "this table would
be manually defined".

A database table is the obvious end state so the Feedback module can change rows
without a deploy — the same path `PolicyRegistry` is on. **That is a schema
change and needs explicit approval per AGENTS.md §6.** Not proposed yet.

## 8. Open items

- Payload typing per trigger: one discriminated union, or an opaque payload each
  handler narrows? A union is safer and costs a line per trigger.
- Does the dispatcher need its own feature flag, or is an empty table inert
  enough? (ACS actions stay behind `ANTICHEAT_ENABLED` regardless.)
- Ordering: are rows for one trigger independent, or can an action depend on
  another having run? Independent is the assumption until something needs otherwise.
