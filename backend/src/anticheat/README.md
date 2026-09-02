# Anti-Cheat System (ACS)

> **Status: framework, plus one working slice.**
>
> Most method bodies are `throw new Error("Not implemented")` — the structure
> exists, the behaviour does not. The exception is **post-game blunder review**,
> which is implemented end to end and wired into the Play flow. See §9.

Source of truth: `reference_docs/Feature Definition: Anti-cheat System`.
That document is itself marked ~50% complete by its author, so this framework is
explicit about which parts are derived from finished sections and which are
extrapolated from stated goals.

---

## 1. Implementation Summary

The ACS is structured as the six modules the spec defines, plus offender review
(which the spec marks `[TODO: Add offender review as another component]`):

| Module | Directory | Primary classes |
|---|---|---|
| Public | `public/` | `ReportService`, `EligibilityService` |
| Detection | `detection/` | `DetectionEngine`, `Check` (+6 checks), `TriggerScheduler`, `StatisticalBaselines`, `PlayingPersonalityService` |
| Penalty | `penalty/` | `PenaltyManager`, `EscalationLadder` |
| Compensation | `compensation/` | `CompensationManager` |
| Simulation | `simulation/` | `SimulationRunner`, `CheatInjector`, `DetectionMetrics` |
| Feedback & Correction | `feedback/` | `PolicyRegistry`, `EffectivenessReview` |
| Offender Review | `review/` | `CaseManager`, `AppealService` |

`AntiCheatSystem` is the facade. Other domains depend on it and never on internals.

The full loop:

```
trigger → detection → red flags → escalation → case → arbiter decision
        → penalty + compensation → appeal → feedback → policy change
```

---

## 2. Acceptance Criteria

- [x] Every module in the spec has a corresponding class with typed signatures.
- [x] The spec's two non-negotiable rules are enforced structurally (see §3).
- [x] `npx tsc --noEmit` passes across the whole backend.
- [x] Post-game blunder review runs end to end against a real engine (§9).
- [x] A finished game in the Play flow produces a text report.
- [x] No schema or migration changes.

---

## 3. Key Architectural Decisions

### 3.1 The spec's two "Avoid these" rules are enforced by the type system

**"Never have a single module/policy for all Situations."**
Every decision-making signature takes a `Situation` (proficiency × event type).
There is no situation-less overload anywhere in the module.

**"Never have static rules or policies."**
No decision threshold appears outside `PolicyRegistry`. Every weight, band, and
certainty bar is resolved at call time, so Feedback & Correction can change one
without a deploy. **A hardcoded threshold anywhere else in this directory should
fail review.** The centipawn bands that classify blunders live in
`PolicyRegistry.getMoveQualityBands()` for exactly this reason.

### 3.2 Detection intensity varies by Situation; penalties do not

Detection effort scales with risk — a casual unrated game may warrant post-game
analysis alone, a prize tournament warrants every check, in-game and post-game.

Penalty severity does **not** scale. The spec's reasoning, followed here: if
cheating in low-stakes games carried weaker consequences, those games would
become a safe environment in which users learn to evade detection before moving
to games that matter. `Situation` still appears in `PenaltyManager` signatures
(certainty thresholds are situation-scoped) but must never soften an outcome.
The precedent is FIDE, which does not define a category of competition in which
cheating is a lesser offence.

### 3.3 Detection is decoupled from consequence

`DetectionEngine` returns a `DetectionOutcome` and does nothing else. It does not
penalise, notify, or conclude. This is what lets `SimulationRunner` execute it
thousands of times against synthetic data with no side effects.

### 3.4 Fire-and-forget, mirroring Session → Results

No ACS hook may delay a move, hold a clock, or change a result. If the ACS is
slow, failing, or disabled, games still complete correctly. An anti-cheat system
capable of breaking games would be a larger liability than the cheating it
prevents.

### 3.5 Types live in `anticheat/`, not `contracts/`

`contracts/` is the frozen M0 inter-domain surface. The ACS owns its types in
`anticheat/types.ts` until a genuine cross-domain contract is required. This PR
touches no frozen surface.

### 3.6 `AnalyzedMove` is deliberately not `contracts.Move`

`contracts.Move` is an opaque `Record<string, unknown>` interpretable only by its
originating Variant, and carries no timing data. Every time-based check requires
server-authoritative per-ply timing. See §5.

---

## 4. Regression Guard

Future work **must not**:

- Introduce a numeric threshold outside `PolicyRegistry`.
- Add a decision-making method that omits `Situation`.
- Make penalty severity a function of `EventType`.
- Give `DetectionEngine` the ability to apply a penalty or notify a user.
- Return internal methodology (scores, weights, thresholds, evidence strings)
  from any user-facing endpoint.
- Let any ACS call block, delay, or alter a game.
- Apply a penalty without a `caseId` — an unappealable penalty violates a
  stated goal of the spec.

---

## 5. Known Blockers

These are prerequisites, not follow-up polish. Each blocks real work downstream.

| # | Blocker | Blocks | Notes |
|---|---|---|---|
| 1 | **No per-ply timing.** `GameRecord.moveHistory` is opaque JSON; `Move` is `Record<string, unknown>`. No think-time is recorded. | `MoveTimeCheck`, all Type 3 detection | Requires a Session change. Must be server-measured — a client-reported time is trivially forged. |
| 2 | ~~No server-side engine.~~ **RESOLVED** — `detection/engine/StockfishEngine.ts` runs Stockfish 18 in Node. | — | See §9. |
| 3 | **No baseline data.** The spec's own expected-accuracy table is unfinished (800 guessed, 1000 and 1200 left as `?`). | All of `StatisticalBaselines`, and therefore most checks | Needs an OTB corpus + engine analysis over it. This is the dominant compute cost in the ACS. |
| 4 | **No tournament domain.** `GameRecord.tournamentContext` is an opaque passthrough JSON field. | Prize compensation, tournament triggers, tournament simulation | A large share of the spec assumes tournaments exist. |
| 5 | **Reports do not reach our database.** `frontend/src/features/report/ReportForm.tsx` POSTs to web3forms.com, a third-party email relay. | `ReportService` | Smallest high-value fix in the ACS; depends on nothing else. |
| 6 | **No admin/moderation surface.** No reviewer role, no case queue. | `CaseManager`, `AppealService` | |
| 7 | **No ACS persistence.** No models for flags, cases, penalties, appeals, policy versions. | Everything stateful | Schema changes require explicit approval per AGENTS.md §6. |

---

## 6. Consumed By / Dependency Map

Live today:

| Producer | Hook | Purpose |
|---|---|---|
| `results/resultsListener` | `analyseOnGameCompleted` | Post-game blunder review, fire-and-forget |
| `GET /api/games/:id/analysis` | `analyseGameAsText` | On-demand text report for a participant |
| `matchmaking/MatchmakingQueue` | `metadata.positionId` | Makes a finished game replayable |

Intended consumers once the rest is implemented:

| Producer | Hook | Purpose |
|---|---|---|
| `session/SessionManager` | `onMovePlayed` | In-game detection in high-risk Situations |
| Tournament engine (does not exist) | `onTournamentRoundCompleted` | Between-round and end-of-event analysis |
| Matchmaking / event entry | `checkEventEligibility` | Gate unclassifiable accounts out of rated and prize events |
| Frontend report form | `ReportService.submitReport` | Replaces the web3forms path |

---

## 7. Primary File Reference

| File | Purpose |
|---|---|
| `types.ts` | Shared vocabulary: `Situation`, `Suspect`, `AnalyzedMove`, `DetectionOutcome`, escalation and case types |
| `AntiCheatSystem.ts` | Facade; the only class other domains should import |
| `AnalysisService.ts` | **Implemented.** Composition root for post-game analysis; DB↔analysis boundary |
| `index.ts` | Public barrel — import from here, never from internal paths |
| `detection/engine/StockfishEngine.ts` | **Implemented.** Serialised UCI adapter for Stockfish 18 in Node |
| `detection/GameReplay.ts` | **Implemented.** Replays stored moves into engine-evaluated plies |
| `detection/BlunderAnalyzer.ts` | **Implemented.** Classifies moves by centipawn loss |
| `detection/PostGameAnalysis.ts` | **Implemented.** Orchestrates load → replay → classify |
| `detection/AnalysisReport.ts` | **Implemented.** Renders the plain-text report |
| `detection/DetectionEngine.ts` | Runs checks, sums DCS, produces the verdict |
| `detection/Check.ts` | Abstract base for all checks |
| `detection/checks/*.ts` | The four spec checks + engine correlation + personality |
| `detection/StatisticalBaselines.ts` | Expected legitimate play per rating band |
| `detection/PlayingPersonality.ts` | Historical vs current-game style profiles |
| `detection/TriggerScheduler.ts` | When detection runs; where intensity scales with risk |
| `penalty/PenaltyManager.ts` | Applies consequences; certainty as expected-harm |
| `penalty/EscalationLadder.ts` | Levelled scrutiny; patterns over isolated events |
| `compensation/CompensationManager.ts` | Makes Affected Users whole |
| `review/CaseManager.ts` | Offender review; external arbiter packets |
| `review/AppealService.ts` | Appeals against decisions |
| `simulation/CheatInjector.ts` | Injects known cheating into clean OTB games |
| `simulation/SimulationRunner.ts` | Runs scenarios with known ground truth |
| `simulation/DetectionMetrics.ts` | Precision, recall, false positives, calibration |
| `feedback/PolicyRegistry.ts` | Single owner of every tunable number |
| `feedback/EffectivenessReview.ts` | The self-correction loop |
| `public/ReportService.ts` | User reports of suspected cheating |
| `public/EligibilityService.ts` | Gates high-risk events behind classifiable history |

---

## 8. Suggested Next Step

The next slice — reviewing a suspect's whole game history rather than one game —
is specified in `MULTI_GAME_REVIEW_REQUIREMENTS.md`. That document is a proposal
awaiting sign-off; nothing in it is implemented.

Blocker #5 (reports → database) and #1 (per-ply timing) are independent of every
open design question and unblock the most downstream work. Neither requires the
spec's remaining 50% to be written first.

Everything else should wait on product direction, particularly:

- The offender review section the spec marks `[TODO]`.
- Whether tournaments are in scope before or after ACS detection.
- Which OTB corpus to use for baselines (a sourcing and licensing decision).

---

## 9. Post-Game Blunder Review (implemented)

The first working slice of the Detection module. It produces a report a human
reads. It does **not** score, flag, or penalise anyone — wiring it into
`DetectionEngine` as a scored `Check` waits on `StatisticalBaselines`, because a
blunder count means nothing without knowing what is normal for that rating.

### Pipeline

```
GameRecord ──► AnalysisService.loadAnalysableGame
                 └─ startingFen from metadata.positionId
           ──► GameReplay        (chess.js + Stockfish, one eval per ply)
           ──► BlunderAnalyzer   (centipawn loss → quality band)
           ──► renderTextReport  (plain text)
```

### Reaching it

- `GET /api/games/:id/analysis` → `text/plain`. Auth required, and restricted to
  the game's own participants — the report names every mistake a player made, so
  a public endpoint would be a scouting tool.
- Automatically on game completion via `resultsListener`, logged server-side.

Both are gated behind `ANTICHEAT_ENABLED` (default `false`).

### Why the starting position is duplicated into metadata

Games are Chess960 with a random `positionId`, chosen in `MatchmakingQueue` and
placed only on `MatchDescriptor.variantParams` — which is never persisted. Stored
moves are `{from, to}` coordinates with no board attached, so **a finished game
could not be replayed at all**, and therefore could not be analysed.

`metadata` is the only field that reaches `GameRecord` intact, so `positionId` is
written there too. This avoids a schema change. It does bend the `contracts/`
README line that metadata is audit-only and acted on by no domain; a nullable
`startingFen` column is the cleaner long-term fix.

**Games played before this change cannot be analysed** and return HTTP 422 with
an explanation rather than a misleading report from a guessed starting board.

### Measured behaviour

| | |
|---|---|
| Engine | Stockfish 18 Lite (WASM, single-threaded), from the `stockfish` npm package |
| Boot | ~200ms, once per process, lazily |
| Throughput | ~46 plies at depth 12 in ~1.5s |
| Concurrency | Serialised — a UCI engine holds one position at a time |

### What the report contains

Per side: accuracy, blunder/mistake/inaccuracy counts, average centipawn loss,
engine-best rate, longest engine-best streak, and the worst single move. Plus the
game's turning point, and a list of every notable move with the engine's
preference.

**Accuracy** uses Lichess's published model — centipawns become a win
percentage, and accuracy decays exponentially with the win percentage given away.
Raw centipawn loss is a poor proxy on its own: giving away 100cp from a level
position matters far more than giving it away from +900.

**Longest engine-best streak** counts consecutive moves matching the engine's
first choice. It is a Type 1 signal — a player can hold an unremarkable game
average while following the engine through one decisive stretch. Reported only,
never judged: streaks of 4–5 are normal in ordinary strong play (measured on a GM
game), and forced sequences inflate it. Judging it needs `StatisticalBaselines`.

**Turning point** is the earliest move after which one side stays decisively
ahead for the rest of the game. Deliberately not "the biggest mistake" — that is
already the worst-move line, and a game can be decided by accumulation rather
than by one error.

### Known limitations

- **Depth 12 is not a strong opinion.** No tuning has been done, because tuning
  requires the Simulation module.
- **Centipawn loss is clamped at 1000.** A move allowing mate scores ~10000cp and
  would otherwise make an average centipawn loss meaningless.
- **`thinkTimeMs` is 0 on every move** — blocker #1. Timing-based checks must
  treat it as absent, not as instant play.
- **One engine per process, serialised.** Fine for the current volume; it needs a
  worker pool before analysis runs on every game at scale.
