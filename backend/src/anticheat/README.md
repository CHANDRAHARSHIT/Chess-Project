# Anti-Cheat System (ACS) — Class Framework

> **Status: framework only.** Every method body is `throw new Error("Not implemented")`.
> This PR establishes the class structure, properties, and method signatures.
> No behaviour, no database models, no routes, no wiring into other domains.

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

This PR is complete when:

- [x] Every module in the spec has a corresponding class with typed signatures.
- [x] The spec's two non-negotiable rules are enforced structurally (see §3).
- [x] `npx tsc --noEmit` passes across the whole backend.
- [x] No behaviour is implemented — every body throws.
- [x] No existing file is modified; no schema or migration changes.

---

## 3. Key Architectural Decisions

### 3.1 The spec's two "Avoid these" rules are enforced by the type system

**"Never have a single module/policy for all Situations."**
Every decision-making signature takes a `Situation` (proficiency × event type).
There is no situation-less overload anywhere in the module.

**"Never have static rules or policies."**
No numeric constant appears anywhere in `anticheat/`. Every threshold, weight,
and certainty bar is resolved at call time from `PolicyRegistry`, which the
Feedback & Correction module can change without a deploy. **A hardcoded
threshold anywhere else in this directory should fail review.**

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
| 2 | **No server-side engine.** Stockfish exists only in the frontend (`frontend/src/shared/hooks/useStockfish.ts`). | Every accuracy, blunder, and engine-correlation check | A client-side engine cannot be trusted for evidence. |
| 3 | **No baseline data.** The spec's own expected-accuracy table is unfinished (800 guessed, 1000 and 1200 left as `?`). | All of `StatisticalBaselines`, and therefore most checks | Needs an OTB corpus + engine analysis over it. This is the dominant compute cost in the ACS. |
| 4 | **No tournament domain.** `GameRecord.tournamentContext` is an opaque passthrough JSON field. | Prize compensation, tournament triggers, tournament simulation | A large share of the spec assumes tournaments exist. |
| 5 | **Reports do not reach our database.** `frontend/src/features/report/ReportForm.tsx` POSTs to web3forms.com, a third-party email relay. | `ReportService` | Smallest high-value fix in the ACS; depends on nothing else. |
| 6 | **No admin/moderation surface.** No reviewer role, no case queue. | `CaseManager`, `AppealService` | |
| 7 | **No ACS persistence.** No models for flags, cases, penalties, appeals, policy versions. | Everything stateful | Schema changes require explicit approval per AGENTS.md §6. |

---

## 6. Consumed By / Dependency Map

Nothing consumes this module yet. Intended consumers once implemented:

| Producer | Hook | Purpose |
|---|---|---|
| `session/SessionManager` | `onMovePlayed` | In-game detection in high-risk Situations |
| `results/resultsListener` | `onGameCompleted` | Post-game analysis |
| Tournament engine (does not exist) | `onTournamentRoundCompleted` | Between-round and end-of-event analysis |
| Matchmaking / event entry | `checkEventEligibility` | Gate unclassifiable accounts out of rated and prize events |
| Frontend report form | `ReportService.submitReport` | Replaces the web3forms path |

---

## 7. Primary File Reference

| File | Purpose |
|---|---|
| `types.ts` | Shared vocabulary: `Situation`, `Suspect`, `AnalyzedMove`, `DetectionOutcome`, escalation and case types |
| `AntiCheatSystem.ts` | Facade; the only class other domains should import |
| `index.ts` | Public barrel — import from here, never from internal paths |
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

Blocker #5 (reports → database) and #1 (per-ply timing) are independent of every
open design question and unblock the most downstream work. Neither requires the
spec's remaining 50% to be written first.

Everything else should wait on direction from the founder, particularly:

- The offender review section the spec marks `[TODO]`.
- Whether tournaments are in scope before or after ACS detection.
- Which OTB corpus to use for baselines (a sourcing and licensing decision).
