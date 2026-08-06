# XLChess Multiplayer — Implementation History & Developer Reference

This document tracks the milestone-by-milestone implementation history, public APIs, frozen contracts, and developer reference for the XLChess multiplayer foundation.

---

## Milestone M0 — Infrastructure De-risking, Contracts & Observability

- **Status**: Completed & Frozen
- **Primary Goal**: Surface the HTTP server attachment point, define frozen inter-domain contracts, establish observability conventions, configure multiplayer environment variables, and provide a standalone WebSocket topology validation tool.

### Summary of Implementation

1. **HTTP Server Attachment Point**:
   - Modified `backend/src/index.ts` to export `const server = app.listen(...)`.
   - Allows future WebSocket servers (M1 Transport) to attach via `new WebSocketServer({ server })` without opening a secondary port.

2. **Frozen Domain Contracts (`backend/src/contracts/`)**:
   - Established immutable interface definitions for the three inter-domain seams:
     - `MatchDescriptor`: Handed off from intent producers (Matchmaking FCFS) to Session.
     - `VariantContract`: Pure-function rules interface invoked by Session.
     - `GameResult`: Terminal game summary emitted by Session to Results & Rating.
   - All types re-exported via `backend/src/contracts/index.ts`.

3. **Observability Convention (`backend/src/observability/`)**:
   - Configured Rollbar integration in `rollbar.ts` (gracefully degrades when `ROLLBAR_TOKEN` is absent).
   - Created structured event helpers in `observe.ts`:
     - `emitTransition()`: Logs state-machine transitions (`from → to`) to console and Rollbar.
     - `reportError()`: Reports errors at domain boundaries to console and Rollbar.
   - Wired `reportError()` into `backend/src/middleware/error.middleware.ts` for HTTP-path error monitoring.

4. **Configuration & Feature Flag**:
   - Extended `backend/src/config/env.ts` and `backend/.env` with optional variables:
     - `MULTIPLAYER_ENABLED` (boolean, default: `false`)
     - `WS_PATH` (string, default: `/ws`)
     - `ROLLBAR_TOKEN` (string, optional)

5. **Topology Validation Tool**:
   - Created `backend/src/scripts/ws-spike.ts`: An isolated validation utility used strictly to test connection stability, ping/pong heartbeat, and Vercel → Railway upgrade traversal.
   - **Important**: `ws-spike.ts` is intentionally isolated to verify infrastructure assumptions. It is **NOT** part of the production multiplayer runtime and must **never** be used as the actual Transport implementation.

---

### Acceptance Criteria

This milestone is considered complete based on the following implementation criteria:

1. **HTTP Server Surfaced**: `backend/src/index.ts` exports the `http.Server` instance returned by `app.listen()` without altering existing Express app initialization or listening behavior.
2. **Contracts Module Frozen**: All three inter-domain contracts (`MatchDescriptor`, `VariantContract`, `GameResult`) are defined as TypeScript types/interfaces in `backend/src/contracts/` and exported via `backend/src/contracts/index.ts`.
3. **Observability Operational**: `backend/src/observability/` implements `emitTransition()`, `reportError()`, and `initRollbar()` with graceful fallback when `ROLLBAR_TOKEN` is missing, and `reportError()` is integrated into Express error middleware.
4. **Environment Variables Configured**: `backend/src/config/env.ts` parses optional multiplayer variables (`MULTIPLAYER_ENABLED`, `WS_PATH`, `ROLLBAR_TOKEN`) with safe defaults (`MULTIPLAYER_ENABLED=false`).
5. **Topology Tool Isolated**: `backend/src/scripts/ws-spike.ts` compiles and runs as an independent validation script without importing production runtime state.
6. **Clean Build**: `npm run build` (`prisma generate && tsc`) completes cleanly with zero errors.

---

### Key Architectural & Implementation Decisions

- **Strict M0 Freeze**: M0 deliverables are frozen. Subsequent milestones consume M0 without modifying its bootstrap or contracts.
- **Matchmaking Domain & Pairing Strategy**: Matchmaking is the architectural domain. First-Come, First-Served (FCFS) is simply the current initial pairing strategy. Future strategies (rating-based, invitations, tournaments, custom lobbies) extend Matchmaking without affecting downstream contracts (`MatchDescriptor`).
- **Value Immutability**: `MatchDescriptor` and `GameResult` are immutable objects (`readonly` fields enforced).
- **Pure Variant Functions**: `VariantContract` methods are pure, synchronous functions with zero side-effects or I/O.

---

### Regression Guard

To prevent future milestones from accidentally modifying or redesigning completed M0 work:

- **Consume, Do Not Redesign**: Future milestones consume M0 abstractions rather than redesigning them.
- **Contract & Bootstrap Stability**: Existing contracts, observability conventions, bootstrap behavior, exported APIs, and environment variable semantics must remain unchanged unless fixing a verified defect or addressing a genuine implementation blocker.
- **Additive Evolution**: Architectural evolution should happen by extending later milestones rather than rewriting previous ones.
- **No Unjustified Modifications**: Opportunistic refactoring, cleanup, stylistic improvements, or personal preferences are not sufficient reasons to modify frozen milestone work.

---

### Public APIs & Contracts Introduced

#### 1. Importing Contracts
```typescript
import type {
  MatchDescriptor,
  VariantContract,
  GameResult,
  TimeControl,
  ParticipantAssignment
} from "../contracts/index.js";
```

#### 2. Emitting Observability Events
```typescript
import { emitTransition, reportError } from "../observability/index.js";

// State machine transition logging
emitTransition({
  domain: "session",
  from: "WAITING",
  to: "READY",
  context: { gameSessionId: "game_123" }
});

// Domain error reporting
reportError({
  domain: "matchmaking",
  error: new Error("Queue timeout"),
  fatal: false,
  context: { userId: "user_456" }
});
```

---

### Consumed By

| Major Component | Depended On By |
|---|---|
| **Inter-Domain Contracts** (`backend/src/contracts/`) | Session, Matchmaking, Variant, Results |
| **Observability** (`backend/src/observability/`) | Every multiplayer domain (Transport, Matchmaking, Session, Variant, Results, HTTP) |
| **Environment Configuration** (`backend/src/config/env.ts`) | Transport, Session, Matchmaking, Frontend |
| **HTTP Server Attachment** (`server` in `backend/src/index.ts`) | Transport (M1 runtime) |
| **WebSocket Topology Spike** (`backend/src/scripts/ws-spike.ts`) | Infrastructure validation only (isolated utility, not production runtime) |

---

### Primary File References (M0)

| File Path | Description |
|---|---|
| [`backend/src/index.ts`](file:///d:/XLchess/Chess-Project/backend/src/index.ts) | Server entry point; exports `server` instance & initializes Rollbar |
| [`backend/src/config/env.ts`](file:///d:/XLchess/Chess-Project/backend/src/config/env.ts) | App configuration schema & defaults |
| [`backend/src/middleware/error.middleware.ts`](file:///d:/XLchess/Chess-Project/backend/src/middleware/error.middleware.ts) | Express centralized error handler with Rollbar hook |
| [`backend/src/contracts/matchDescriptor.ts`](file:///d:/XLchess/Chess-Project/backend/src/contracts/matchDescriptor.ts) | Match Descriptor frozen contract |
| [`backend/src/contracts/variantContract.ts`](file:///d:/XLchess/Chess-Project/backend/src/contracts/variantContract.ts) | Variant Contract frozen interface |
| [`backend/src/contracts/result.ts`](file:///d:/XLchess/Chess-Project/backend/src/contracts/result.ts) | Game Result frozen contract |
| [`backend/src/contracts/index.ts`](file:///d:/XLchess/Chess-Project/backend/src/contracts/index.ts) | Contracts barrel export |
| [`backend/src/observability/rollbar.ts`](file:///d:/XLchess/Chess-Project/backend/src/observability/rollbar.ts) | Rollbar SDK wrapper |
| [`backend/src/observability/observe.ts`](file:///d:/XLchess/Chess-Project/backend/src/observability/observe.ts) | Event & error reporting contract helpers |
| [`backend/src/observability/index.ts`](file:///d:/XLchess/Chess-Project/backend/src/observability/index.ts) | Observability barrel export |
| [`backend/src/scripts/ws-spike.ts`](file:///d:/XLchess/Chess-Project/backend/src/scripts/ws-spike.ts) | Standalone WebSocket echo & heartbeat spike script |

---

## Milestone M1 — Independent Pillars (Transport, Matchmaking FCFS, Variant & Session)

- **Status**: Completed & Unit-Tested
- **Primary Goal**: Construct the three independent pillars (Transport skeleton, Matchmaking FCFS queue, Variant rules engine + Session lifecycle orchestrator) in complete isolation against stubs, fully instrumented and unit-tested without cross-pillar wiring or database persistence.

### 1. Summary of Implementation

1. **Pillar A — Transport Skeleton (`backend/src/transport/`)**:
   - `ConnectionManager`: Manages WebSocket connections with `Map<ConnectionId, Connection>`, O(1) user index (`userIndex`), and O(1) resume token index (`resumeIndex`). Fully rules-blind.
   - `ReconnectBuffer`: In-memory ring buffer keyed by stable `ResumeToken` for monotonic gap-free message replay upon reconnection.
   - `HeartbeatTicker`: 15s ping / 30s timeout liveness detector. Wire-liveness only — never triggers game actions directly.
   - `TransportServer`: Bootstraps `WebSocketServer` attached to HTTP `server` at `MULTIPLAYER_ENABLED` startup. Handles initial handshake and reconnect handshake.

2. **Pillar B — Matchmaking FCFS Queue (`backend/src/matchmaking/`)**:
   - `MatchmakingQueue`: Pure in-memory FCFS queue. Pairs first two `WAITING` tickets with matching `variantId`. Emits immutable `MatchDescriptor`.
   - Ticket map lifecycle policy: Immediate deletion on `CANCELLED` / `EXPIRED`; 5-minute retention for `MATCHED` polling.
   - `ExpiryTicker`: 30s interval driving ticket expiry, retention pruning, and automatic pairing re-checks.
   - Express router & controller: Flag-gated routes (`POST /api/matchmaking/queue`, `DELETE /api/matchmaking/queue/:ticketId`, `GET /api/matchmaking/queue/:ticketId`). Thin HTTP adapter delegating all orchestration to `MatchmakingQueue`. Mounted in `app.ts`.

3. **Pillar C — Variant & Session (`backend/src/variant/`, `backend/src/session/`)**:
   - `Chess960Variant`: Pure rules-engine implementation of `VariantContract`. Features Scharnagl 0–959 starting position generator (using `crypto.randomInt`), FEN state transitions, and move validation. Zero I/O.
   - `variantRegistry`: Map-based registry (`variantRegistry.get("chess960")`). Zero `switch(variantId)` statements anywhere.
   - `SessionManager`: Rules-blind game lifecycle orchestrator enforcing Phase 3.2 §8 canonical state machine (`CREATED → WAITING → READY → PLAYING → COMPLETED / ABANDONED`). Sole clock authority (`SessionClock` side-indexed; running only in `PLAYING` state). Single state owner of `moveHistory`. Emits fire-and-forget `GameResult` guarded by `resultEmitted` flag (at most once).
   - `ClockTicker`: 100ms interval driving session clock ticks.

4. **M0 Additive Amendment (M0-AM-01)**:
   - Added `if (env.MULTIPLAYER_ENABLED) { bootstrapTransport(server); }` in `backend/src/index.ts` after `app.listen()`. Additive only — zero existing lines altered. Satisfies all four Phase 3 amendment criteria.

---

### 2. Acceptance Criteria

Milestone M1 is complete based on the following verified criteria:

1. **Independent Pillars**: Each pillar (Transport, Matchmaking, Variant/Session) runs standalone against stubs without cross-pillar imports.
2. **State Machines Unit-Tested**: 25 unit tests across 4 test suites (`Chess960Variant`, `SessionManager`, `MatchmakingQueue`, `ConnectionManager`) pass with zero failures.
3. **Transport Reconnect-Replay**: ConnectionManager assigns monotonic sequence numbers per `ResumeToken` and replays missed messages upon reconnection.
4. **Matchmaking Ticket Lifecycle**: Idempotent enqueuing, authorized cancellation, automatic 2-player FIFO matching, immediate deletion of cancelled/expired tickets, and 5-min matched ticket retention verified.
5. **Session State Machine & Clock Authority**: Canonical state transitions (`CREATED → WAITING → READY → PLAYING → COMPLETED/ABANDONED`) verified. Clocks start strictly on first move (`READY → PLAYING`). `GameResult` emitted at most once.
6. **Chess960 Parity**: All 960 starting position IDs (0–959) generate valid FENs and pass rule validation.
7. **Clean Build**: `npm run build` (`prisma generate && rimraf dist && tsc`) completes with 0 errors.

---

### 3. Key Architectural & Implementation Decisions

- **No DB Persistence in M1**: All queues, connections, and sessions remain strictly in-memory (`Map`s). Zero schema changes or Prisma migrations.
- **Rules-Blind Transport & Session**: Transport detects wire sockets; Session interprets game presence. Session delegates all chess rules to `VariantContract`.
- **Single State Ownership**: `SessionManager` is the sole owner of move history (`moveHistory` removed from `Chess960GameState`).
- **Stable Reconnect Identity**: Reconnection uses a stable `ResumeToken` rather than transient socket IDs.
- **At-Most-Once GameResult**: Emitted fire-and-forget via a guarded `resultEmitted` boolean flag to prevent race conditions.

---

### 4. Regression Guard

- **Do Not Modify M1 Pillars for Integration**: M2 wires Transport, Matchmaking, and Session via interfaces and events. Do not rewrite internal state machine logic of M1 components during M2 wiring.
- **State Machine Integrity**: Do not bypass `SessionManager` state transitions or clock authority.
- **No Direct DB Access in Variant or Transport**: Variant remains pure functions; Transport remains rules-blind socket management.

---

### 5. Public APIs & Contracts Introduced (M1)

#### Matchmaking Endpoint (`POST /api/matchmaking/queue`)
```json
// Request
POST /api/matchmaking/queue
{ "variantId": "chess960" }

// Response (201 Created)
{
  "ticket": {
    "ticketId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userId": "user-123",
    "variantId": "chess960",
    "status": "WAITING"
  },
  "matched": false
}
```

#### Instantiating Session & Transport
```typescript
import { SessionManager } from "./session/index.js";
import { connectionManager } from "./transport/index.js";
import { Chess960Variant } from "./variant/index.js";

// Session instance with result listener
const sessionManager = new SessionManager((gameResult) => {
  console.log("Game completed:", gameResult.gameSessionId, gameResult.outcome);
});
```

---

### 6. Consumed By / Dependency Map

| M1 Component | Consumed By (Downstream) |
|---|---|
| **`backend/src/variant/`** | Session (M1), Matchmaking params validation (M2) |
| **`backend/src/session/`** | Transport-Session Wire Bridge (M2), Results Writer (M4) |
| **`backend/src/matchmaking/`** | Matchmaking Seam Integration (M3), HTTP Client (M5) |
| **`backend/src/transport/`** | Session Wire Bridge (M2), Client WebSockets (M5) |

---

### 7. Primary File References (M1)

| File Path | Description |
|---|---|
| [`backend/src/variant/chess960/Chess960Variant.ts`](file:///d:/XLchess/Chess-Project/backend/src/variant/chess960/Chess960Variant.ts) | Chess960 rules implementation (`VariantContract`) |
| [`backend/src/variant/chess960/chess960Rules.ts`](file:///d:/XLchess/Chess-Project/backend/src/variant/chess960/chess960Rules.ts) | Pure Scharnagl 960 generator & chess move validator |
| [`backend/src/variant/registry.ts`](file:///d:/XLchess/Chess-Project/backend/src/variant/registry.ts) | Centralized variant map registry |
| [`backend/src/session/SessionManager.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/SessionManager.ts) | Rules-blind session state machine & clock authority |
| [`backend/src/session/clockTicker.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/clockTicker.ts) | 100ms clock interval ticker |
| [`backend/src/matchmaking/MatchmakingQueue.ts`](file:///d:/XLchess/Chess-Project/backend/src/matchmaking/MatchmakingQueue.ts) | In-memory FCFS queue & pairing logic |
| [`backend/src/matchmaking/matchmaking.controller.ts`](file:///d:/XLchess/Chess-Project/backend/src/matchmaking/matchmaking.controller.ts) | Thin Express HTTP controller |
| [`backend/src/matchmaking/matchmaking.route.ts`](file:///d:/XLchess/Chess-Project/backend/src/matchmaking/matchmaking.route.ts) | Flag-gated Express router (`/api/matchmaking`) |
| [`backend/src/transport/ConnectionManager.ts`](file:///d:/XLchess/Chess-Project/backend/src/transport/ConnectionManager.ts) | Wire connection registry & resumeToken index |
| [`backend/src/transport/reconnectBuffer.ts`](file:///d:/XLchess/Chess-Project/backend/src/transport/reconnectBuffer.ts) | In-memory sequence-numbered replay buffer |
| [`backend/src/transport/heartbeat.ts`](file:///d:/XLchess/Chess-Project/backend/src/transport/heartbeat.ts) | 15s/30s ping-pong liveness ticker |
| [`backend/src/transport/TransportServer.ts`](file:///d:/XLchess/Chess-Project/backend/src/transport/TransportServer.ts) | WebSocket server bootstrap |

---

### 8. Upcoming Milestone Handoff / Follow-up Work (M2)

- **Milestone M2 — Data-Plane Vertical (Session ↔ Variant ↔ Transport Wiring)**:
  - Wire Transport connection events to Session presence signals (`participant_connected`, `participant_disconnected`).
  - Wire inbound client WebSocket moves directly to `SessionManager.submitMove()`.
  - Wire outbound session state updates to `ConnectionManager.broadcast()`.

---

## Milestone M2 — Data-Plane Vertical (Session ↔ Variant ↔ Transport Wiring)

- **Status**: Completed & Unit-Tested
- **Primary Goal**: Wire the three independent M1 pillars into a single live, authoritative game loop, internal-only, driven by a manually-injected `MatchDescriptor`. Matchmaking remains deliberately absent (M3).

### 1. Summary of Implementation

1. **Amendment M1-AM-01 — `PAUSED` restored to `SessionStatus`**:
   - Phase 3.2 §4 (frozen) always specified a `PAUSED` state for "all participants disconnected simultaneously," with a defined resume path. M1's `SessionManager` omitted it while building the pillar in isolation against stubs.
   - M2 restores it: `SessionStatus` gains `PAUSED` on the `PLAYING` branch only. Every existing transition (`CREATED→WAITING→READY→PLAYING→COMPLETED/ABANDONED`) and every existing method signature is unchanged. `tickClocks()`'s pre-existing `if (status !== "PLAYING") continue` guard already excludes `PAUSED` with zero code change.
   - This is a gap-fill against an already-frozen contract, not a new design decision.

2. **Session presence interpretation (`backend/src/session/SessionManager.ts`)**:
   - `notifyParticipantConnected(sessionId, userId)` / `notifyParticipantDisconnected(sessionId, userId)` — Session's sole entry points for presence facts. Transport detects; Session interprets (Phase 3.2 §6).
   - `getSessionIdForParticipant(userId)` — reverse index (`userId → sessionId`), the single owner of "which session is this participant currently in," populated in `createSession()` and cleared in `cleanupSession()`.
   - **WAITING no-show timeout** (default 60s, constructor-overridable): no participant shows up → `WAITING → ABANDONED`, no `GameResult` emitted (no meaningful gameplay occurred — zero moves, zero clock consumption).
   - **Per-participant grace timer** (default 30s): one participant disconnects during `READY`/`PLAYING` while another remains → grace timer; expiry reuses the existing, unmodified `forfeit()` method. Reconnecting within grace clears the timer with no lifecycle change.
   - **Global pause grace timer** (default 60s, M1-AM-01): *all* participants disconnect during `PLAYING` → `PLAYING → PAUSED`, clocks implicitly stop (existing `tickClocks()` guard). Any reconnect within grace → `PAUSED → PLAYING`, clock resumes without charging the paused wall-clock time. Expiry with nobody back → `ABANDONED` with `GameResult.terminationReason: "forfeit"`, `outcome: { kind: "draw" }` — the only outcome shape the frozen `GameResult` contract permits with no winning side.
   - All grace/timeout durations are constructor-overridable (`SessionTimings`), mirroring `MatchmakingQueue`'s existing `ticketTtlMs` pattern, so tests don't wait on real 30–60s timers.
   - Outbound broadcasts: `state_update` after every non-terminal accepted move and on `READY`/`PLAYING`-resume transitions; `game_over` on every terminal path (`handleTerminal`, `tickClocks` timeout, `forfeit`, pause-grace expiry) — all via the injected `SessionTransport`, never a concrete Transport import.

3. **Session ⇄ Transport wiring (`backend/src/session/sessionTransportBridge.ts`, new)**:
   - The only module that imports both `transport/` and `session/` concretely — the seam anticipated by M1's own dependency map as "Session Wire Bridge (M2)."
   - Routing only: no game rules, no pairing logic, no persistence.
   - `sessionTransportImpl: SessionTransport` — thin pass-through to the `connectionManager` singleton (`send`/`broadcast`/`isConnected`).
   - `wireSessionTransportBridge(sessionManager)` — subscribes to `ConnectionManager.onConnectionEvent()` and forwards `connected`/`disconnected` facts to `sessionManager.notifyParticipantConnected/Disconnected`; returns the `onAppMessage` hook that routes `{type: "submit_move"}` messages to `sessionManager.submitMove()`. A message from a user with no active session is rejected informatively (`{type: "error", payload: {reason: "no_active_session"}}`), never thrown.

4. **Transport extensions (additive only — no existing method signatures changed)**:
   - `ConnectionManager.onConnectionEvent(handler)` (new) — `register()`, `markReconnected()`, and `disconnect()` now additionally emit a `ConnectionEvent` (`"connected"`/`"disconnected"`) fact after their existing logic runs unchanged.
   - `TransportServer.bootstrapTransport(server, hooks?)` — `hooks` is a new optional 2nd parameter (`{ onAppMessage? }`), defaulting to a no-op, so the M1 call site `bootstrapTransport(server)` still compiles. Post-handshake, non-reconnect messages are now forwarded to `hooks.onAppMessage`.
   - **Real WS authentication**: the handshake now verifies the connecting identity via the existing `getSession()`/`authConfig` (the same Auth.js session already used by `requireAuth`), closing unauthenticated sockets with `4401`. Replaces M1's stub, which trusted a client-supplied `userId` payload (`dev-user-ws` fallback). `getSession()` only reads `.protocol`/`.headers` off its argument, so a minimal shim (`{ protocol, headers: req.headers }`, protocol resolved from `AUTH_URL`) is passed instead of a full Express `Request`.

5. **Internal dev harness (`backend/src/routes/internalDev.route.ts`, new)**:
   - `POST /api/internal/dev/create-session` — manually builds a `MatchDescriptor` (mirroring exactly what `MatchmakingQueue.tryPair()` produces) from two supplied `userIds` and calls `sessionManager.createSession()`. Lets two real WebSocket clients drive a full game for verification.
   - Double-gated: `MULTIPLAYER_ENABLED` and `NODE_ENV !== "production"`. Explicitly throwaway — replaced by real Matchmaking → Session wiring in M3.

6. **Composition root (`backend/src/index.ts`)**:
   - `SessionManager` is constructed here, injected with `sessionTransportImpl`, and is **not** exported as a module-level singleton (unlike `connectionManager`/`matchmakingQueue`/`Chess960Variant`) — future consumers (Results in M4, real Matchmaking wiring in M3) receive it via injection, keeping composition and testing simple.
   - `wireSessionTransportBridge(sessionManager)` produces the hooks passed to `bootstrapTransport`; the internal dev router and `ClockTicker` are also constructed/started here, inside the existing `if (env.MULTIPLAYER_ENABLED)` block.

7. **Test runner** (`backend/package.json`): added `"test": "tsx --test src/**/__tests__/*.test.ts"`. The M1 `__tests__` files were already written against Node's built-in `node:test` API — no dependency (vitest/jest) was needed, just a script to run them. All 25 pre-existing M1 tests now pass for the first time, plus 7 new M2 tests for presence/grace/`PAUSED` (32 total).

### 2. Acceptance Criteria

1. **Full authoritative game, wired**: Two real WebSocket clients, authenticated via Auth.js, seeded through the internal dev endpoint, complete a full Chess960 game with server-authoritative clocks — moves flow client → `submitMove()` → broadcast, matching Phase 3 §10's M2 row.
2. **Presence-driven lifecycle**: `WAITING → READY` on both connecting; disconnect/reconnect exercises grace timers and (for simultaneous disconnect) `PAUSED ↔ PLAYING` correctly.
3. **Forfeit-on-grace-expiry works**: unmodified `forfeit()` reused for the single-disconnect case; new mutual-draw path for the double-disconnect case.
4. **Reconnection replay works**: unchanged from M1 — `ReconnectBuffer`/`markReconnected()` untouched.
5. **Authenticated transport**: unauthenticated WS upgrades are rejected (`4401`) before `ConnectionManager.register()` is ever called.
6. **Zero regression when disabled**: `MULTIPLAYER_ENABLED=false` → transport doesn't bootstrap, internal dev route 503s, no behavior change elsewhere.
7. **Clean build & tests**: `npm run build` (backend) completes with 0 errors; `npm test` — 32/32 pass.
8. **No `switch(variantId)` introduced** (Invariant 8) — verified; this milestone never branches on variant.

### 3. Key Architectural & Implementation Decisions

- **PAUSED is a formal amendment (M1-AM-01), not a silent change** — see §1.1. Recorded here per AGENTS.md's Documentation Standards so M1/M2 docs and the implementation agree.
- **Global pause-expiry outcome is a defined invariant**: mutual `terminationReason: "forfeit"` / `outcome: { kind: "draw" }` when nobody reconnects — chosen because neither side is more "present" than the other, and `rated` is always `false` in this milestone's scope so it has no rating consequence.
- **No singleton `SessionManager`**: constructed once in the composition root (`index.ts`), injected everywhere it's needed. Unlike M1's `connectionManager`/`matchmakingQueue`/`Chess960Variant` singletons, `SessionManager` needs multiple future consumers (Results, real Matchmaking wiring) and is far easier to test when constructed explicitly rather than as a module-level singleton.
- **Dependency direction preserved**: `SessionManager` depends on a `SessionTransport` *interface*, injected via constructor (same pattern as its existing `onResult`/`variantResolver` params) — it does not import `transport/` concretely. `TransportServer` accepts injected hooks — it does not import `session/` concretely. Only `sessionTransportBridge.ts` imports both, by design.
- **Bridge is routing-only**: `sessionTransportBridge.ts` contains no game rules, pairing logic, persistence, or knowledge of Results/Matchmaking/notifications — stated explicitly in its file header so this doesn't drift as the codebase grows.
- **Presence and timers are runtime-only**: `presence`, `participantGraceTimers`, `pauseGraceTimers`, `waitTimers`, `userToSession` are all in-memory `Map`s inside `SessionManager`, never persisted or reconstructed after a restart — consistent with the rest of M1/M2 and explicitly deferred to M6 ("Server restart... an M6 hardening concern, not a foundation contract" — Phase 3.2 §4).
- **No-session message handling is defined, not silent**: a `submit_move` from a user with no active session gets an informative `error` reply and a non-fatal `reportError`, never a throw or crash — matching the frozen Error Contract's "Recoverable Errors" table.

### 4. Regression Guard

- **Do not modify M1 pillar internals for M3+**: `Chess960Variant`, `chess960Rules.ts`, `MatchmakingQueue`, `ConnectionManager`'s pre-existing methods, and `ReconnectBuffer` were consumed as-is in M2 and must remain so.
- **The internal dev route is throwaway**: `backend/src/routes/internalDev.route.ts` and the `POST /api/internal/dev/create-session` endpoint exist solely for M2 verification. M3 must replace the *session-creation call site* with real `MatchmakingQueue` → `MatchDescriptor` → `SessionManager.createSession()` wiring — it must not build on top of this route.
- **Contracts unchanged**: `MatchDescriptor`, `VariantContract`, `GameResult` were not modified. `PAUSED` is additive to `SessionStatus` only.
- **Composition pattern**: future milestones needing `SessionManager` must receive it via injection from the composition root — do not reintroduce a module-level singleton.

### 5. Public APIs & Frozen Contracts

```typescript
// Session — new presence/lookup surface
sessionManager.notifyParticipantConnected(sessionId: string, userId: string): void
sessionManager.notifyParticipantDisconnected(sessionId: string, userId: string): void
sessionManager.getSessionIdForParticipant(userId: string): string | undefined

// SessionManager constructor — 4th param added, all optional
new SessionManager(onResult?, variantResolver?, transport?: SessionTransport, timings?: SessionTimings)

// Session ⇄ Transport bridge
import { sessionTransportImpl, wireSessionTransportBridge } from "./session/index.js";
const hooks = wireSessionTransportBridge(sessionManager); // -> TransportHooks

// Transport — additive
connectionManager.onConnectionEvent((event: ConnectionEvent) => { ... });
bootstrapTransport(server, hooks?: TransportHooks);

// Internal dev harness (throwaway — M3 replaces the call site)
POST /api/internal/dev/create-session
{ "userIds": ["user-1", "user-2"] } → { "sessionId": "...", "matchDescriptor": {...} }
```

### 6. Consumed By / Dependency Map

| M2 Component | Consumed By (Downstream) |
|---|---|
| **`SessionManager` presence/grace surface** | `sessionTransportBridge.ts` (M2), real Matchmaking wiring (M3) |
| **`sessionTransportBridge.ts`** | Composition root only (`index.ts`) — not imported elsewhere |
| **`ConnectionManager.onConnectionEvent`** | `sessionTransportBridge.ts` (M2) |
| **`bootstrapTransport` hooks param** | Composition root only |
| **Internal dev route** | M2 manual/E2E verification only — superseded by M3 |

### 7. Primary File References (M2)

| File Path | Description |
|---|---|
| [`backend/src/session/SessionManager.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/SessionManager.ts) | Extended: `PAUSED` (M1-AM-01), presence, grace timers, broadcasts |
| [`backend/src/session/types.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/types.ts) | Extended: `PAUSED` status, `SessionTransport` interface |
| [`backend/src/session/sessionTransportBridge.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/sessionTransportBridge.ts) | New — Session ⇄ Transport wiring, routing only |
| [`backend/src/transport/ConnectionManager.ts`](file:///d:/XLchess/Chess-Project/backend/src/transport/ConnectionManager.ts) | Extended: `onConnectionEvent` |
| [`backend/src/transport/TransportServer.ts`](file:///d:/XLchess/Chess-Project/backend/src/transport/TransportServer.ts) | Extended: real Auth.js verification, `onAppMessage` hook |
| [`backend/src/transport/types.ts`](file:///d:/XLchess/Chess-Project/backend/src/transport/types.ts) | Extended: `ConnectionEvent` type |
| [`backend/src/routes/internalDev.route.ts`](file:///d:/XLchess/Chess-Project/backend/src/routes/internalDev.route.ts) | New — throwaway dev harness for manual descriptor injection |
| [`backend/src/index.ts`](file:///d:/XLchess/Chess-Project/backend/src/index.ts) | Composition root: constructs `SessionManager`, wires bridge, mounts dev route |
| [`backend/src/session/__tests__/SessionManager.presence.test.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/__tests__/SessionManager.presence.test.ts) | New — 7 tests covering presence, grace, `PAUSED` |
| [`backend/package.json`](file:///d:/XLchess/Chess-Project/backend/package.json) | Added `test` script (`tsx --test`) |

### 8. Upcoming Milestone Handoff / Follow-up Work (M3)

- **Milestone M3 — Seam Integration (Matchmaking → Match Descriptor → Session)**:
  - Replace the internal dev route's manual `MatchDescriptor` construction with real `MatchmakingQueue.tryPair()` output flowing into `sessionManager.createSession()`.
  - Atomic ticket consumption under concurrent requests; ticket-consumed-but-session-failed compensation path.
  - Register the real seam in `app.ts`; retire `backend/src/routes/internalDev.route.ts` once the real wiring is proven.

---

## Milestone M3 — Seam Integration (Matchmaking → Match Descriptor → Session)

- **Status**: Completed & Unit-Tested
- **Primary Goal**: Wire `MatchmakingQueue` to `SessionManager` exclusively through the frozen `MatchDescriptor` seam — real sessions are now created automatically when two tickets pair, with atomic ticket consumption and clean compensation on session-creation failure. The M2 internal dev harness is retired.

### 1. Summary of Implementation

1. **Amendment M1-AM-02 — `ExpiryTicker` started for the first time**:
   - `backend/src/matchmaking/expiryTicker.ts` was fully built in M1 (30s interval driving `expireStale()`, `pruneMatched()`, and a `tryPair()` safety sweep) and documented as delivered M1 behavior, but `index.ts`'s composition root never called `.start()` on it. Ticket TTL expiry and MATCHED-ticket retention pruning never ran in the live server.
   - M3 restores it: `new ExpiryTicker().start()` is added to the same `MULTIPLAYER_ENABLED` composition-root block M3 already edits. No change to `ExpiryTicker`'s own code. This is a gap-fill against already-documented M1 intent, not a new design decision — recorded here per AGENTS.md's Documentation Standards, mirroring how M1-AM-01 (`PAUSED`) was recorded in the M2 section.

2. **`MatchmakingQueue` gains an event seam (`backend/src/matchmaking/MatchmakingQueue.ts`)**:
   - `onMatch(handler)` / private `emitMatch()` — mirrors `ConnectionManager.onConnectionEvent` exactly (an array of listeners, invoked synchronously, no per-listener isolation). Matchmaking remains unaware of what a listener does with the descriptor.
   - `tryPair()` now calls `emitMatch(descriptor)` synchronously right before returning, once a pair is found. This is the single path every pairing flows through — whether triggered by `enqueue()` (HTTP request) or by `ExpiryTicker`'s periodic `tryPair()` sweep — so session creation never depends on which call site happened to trigger the pairing.
   - `compensateFailedMatch(descriptor)` — the "ticket-consumed-but-session-failed" compensation path required by Phase 3.2's Error Contract ("Invalid Match Descriptor → Session refuses to initialize. Matchmaking compensates (refund tickets)."). Rebuilds both matched tickets as fresh `WAITING` objects (new `enqueuedAt`/`expiresAt`, cleared `matchedAt`/`descriptor`) rather than mutating in place, preserving `MatchTicket`'s existing `readonly` field contract. Safe no-op for any participant whose ticket already moved on independently.
   - **`enqueue()` correctness fix**: previously returned whatever `tryPair()`'s immediate return value was. Once `emitMatch()` can synchronously trigger compensation *inside* that same `tryPair()` call (via the bridge below), the raw return value can describe a match that was already refunded by the time `enqueue()` returns. `enqueue()` now re-reads the ticket's live state from the map after calling `tryPair()`, so `POST /api/matchmaking/queue` never reports `matched: true` for a pairing that was compensated away in the same request.

3. **Matchmaking ⇄ Session bridge (`backend/src/session/matchmakingSessionBridge.ts`, new)**:
   - The only module that imports both `matchmaking/` and `session/` concretely — mirrors `sessionTransportBridge.ts`'s role and placement exactly (co-located in `session/`, alongside the Transport ⇄ Session seam).
   - `wireMatchmakingSessionBridge(queue, sessionManager)`: registers `queue.onMatch(...)`; on a successful pairing calls `sessionManager.createSession(descriptor)`; on a throw, calls `reportError({ domain: "matchmaking", ... })` and `queue.compensateFailedMatch(descriptor)`.
   - Routing + compensation only — no pairing logic, no session lifecycle logic.

4. **Composition root (`backend/src/index.ts`)**:
   - `wireMatchmakingSessionBridge(matchmakingQueue, sessionManager)` is called immediately after `wireSessionTransportBridge(sessionManager)`, inside the existing `MULTIPLAYER_ENABLED` block.
   - `createInternalDevRouter` import and its `app.use("/api/internal/dev", ...)` mount are removed.
   - `new ExpiryTicker().start()` added (M1-AM-02, above).

5. **Internal dev harness retired**: `backend/src/routes/internalDev.route.ts` is deleted. `POST /api/internal/dev/create-session` no longer exists. Real sessions are now created exclusively via `POST /api/matchmaking/queue` pairing two tickets.

6. **Synchronicity is deliberate, not incidental**: the entire match → session pipeline (`tryPair()` → `emitMatch()` → `createSession()` → compensation-if-needed) runs synchronously within one JS event-loop turn. This is what makes "atomic ticket consumption under concurrent requests" true without any new locking — Node's single-threaded execution model never interleaves two `enqueue()` calls mid-function. This mirrors the already-synchronous, callback-based wiring style `sessionTransportBridge.ts` established in M2. Nothing in the `onMatch` → `createSession` path may become `async` without re-examining this guarantee.

### 2. Acceptance Criteria

1. **Real sessions from real pairing**: two `POST /api/matchmaking/queue` calls for the same variant produce a live `GameSession` reachable via `sessionManager.getSessionIdForParticipant()` for both participants — no manual descriptor construction anywhere.
2. **No double-match under concurrent requests**: verified structurally (single-threaded synchronous execution, no `await` in the pairing→session path) and by test (sequential enqueues never produce more than one pair per two same-variant tickets).
3. **Ticket-consumed-but-session-failed compensates cleanly**: a session-creation failure (e.g. unregistered variant) leaves both tickets back in `WAITING` with a fresh TTL and no dangling `GameSession` — verified by test.
4. **`enqueue()` never lies**: the HTTP response accurately reflects post-compensation ticket state, never a pairing that was already refunded within the same request.
5. **ExpiryTicker running (M1-AM-02)**: ticket TTL expiry and MATCHED-ticket pruning now execute in the live server.
6. **Internal dev harness fully retired**: `backend/src/routes/internalDev.route.ts` deleted; zero remaining references.
7. **Zero regression**: all 32 pre-existing M1/M2 tests pass unmodified; `MULTIPLAYER_ENABLED=false` behavior unchanged.
8. **Clean build & tests**: `npm run build` (backend) — 0 errors; `npm test` — 39/39 pass (32 existing + 7 new).
9. **No `switch(variantId)` introduced** (Invariant 8) — verified via grep; this milestone never branches on variant.

### 3. Key Architectural & Implementation Decisions

- **M1-AM-02 is a formal amendment, not a silent change** — see §1.1. `ExpiryTicker`'s own code is untouched; only the composition root gained the missing `.start()` call.
- **The seam lives inside `tryPair()`, not layered onto `enqueue()`'s return value.** This guarantees exactly one path to session creation regardless of which caller triggered the pairing (HTTP request vs. `ExpiryTicker` sweep) — the alternative (wiring only `enqueue()`'s return path) would have silently dropped any pairing produced by the ticker's sweep.
- **Compensation refunds via object reconstruction, not mutation.** `MatchTicket`'s `readonly` fields stay `readonly`; `compensateFailedMatch` builds a new ticket object and re-`.set()`s it, consistent with how `SessionManager` already replaces (rather than mutates) its own `clock`/`presence` objects.
- **Matchmaking still doesn't know what Session is.** `MatchmakingQueue.onMatch`/`compensateFailedMatch` operate purely in terms of `MatchDescriptor` and ticket bookkeeping — no import of `session/` anywhere inside `matchmaking/`. Only the bridge module crosses the boundary, by design.
- **Synchronous wiring is a continuation of M2's precedent, not a new decision** — see §1.6. Documented explicitly because Phase 3.2 Invariant 15 ("Matchmaking never blocks on Session") could otherwise be misread as requiring an async boundary; the invariant's own text clarifies the concern is failure isolation (satisfied by compensation), not literal non-blocking I/O.

### 4. Regression Guard

- **Do not modify M1/M2 pillar internals for M4+**: `Chess960Variant`, `SessionManager`'s lifecycle/clock/presence logic, `ConnectionManager`, `sessionTransportBridge.ts`, and `ExpiryTicker`'s own scheduling logic were consumed as-is in M3 and must remain so.
- **The match → session path must stay synchronous.** Introducing `async`/`await` anywhere between `tryPair()`'s `emitMatch()` call and `SessionManager.createSession()` returning would reopen the double-match risk this milestone closes structurally rather than with new locking.
- **Contracts unchanged**: `MatchDescriptor`, `VariantContract`, `GameResult` were not modified. No new `TicketStatus` value was added — compensation reuses `WAITING`.
- **`internalDev.route.ts` is gone for good**: M4+ must not reintroduce a manual-descriptor-injection route; use real matchmaking pairing for any future manual verification.

### 5. Public APIs & Frozen Contracts

```typescript
// MatchmakingQueue — new event seam
queue.onMatch(handler: (descriptor: MatchDescriptor) => void): void
queue.compensateFailedMatch(descriptor: MatchDescriptor): void

// Matchmaking ⇄ Session bridge
import { wireMatchmakingSessionBridge } from "./session/index.js";
wireMatchmakingSessionBridge(matchmakingQueue, sessionManager); // -> void

// enqueue()'s return shape is unchanged, but now reflects live post-compensation state:
queue.enqueue(userId, variantId): { ticket: MatchTicket; descriptor: MatchDescriptor | null }
```

### 6. Consumed By / Dependency Map

| M3 Component | Consumed By (Downstream) |
|---|---|
| **`MatchmakingQueue.onMatch` / `compensateFailedMatch`** | `matchmakingSessionBridge.ts` (M3) only |
| **`matchmakingSessionBridge.ts`** | Composition root only (`index.ts`) — not imported elsewhere |
| **`ExpiryTicker` (now started)** | Composition root only |

### 7. Primary File References (M3)

| File Path | Description |
|---|---|
| [`backend/src/matchmaking/MatchmakingQueue.ts`](file:///d:/XLchess/Chess-Project/backend/src/matchmaking/MatchmakingQueue.ts) | Extended: `onMatch`/`emitMatch`, `compensateFailedMatch`, corrected `enqueue()` return |
| [`backend/src/session/matchmakingSessionBridge.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/matchmakingSessionBridge.ts) | New — Matchmaking ⇄ Session wiring, routing + compensation only |
| [`backend/src/session/index.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/index.ts) | Extended: exports `wireMatchmakingSessionBridge` |
| [`backend/src/index.ts`](file:///d:/XLchess/Chess-Project/backend/src/index.ts) | Composition root: wires the M3 bridge, starts `ExpiryTicker` (M1-AM-02), retires internal dev route |
| [`backend/src/routes/internalDev.route.ts`](file:///d:/XLchess/Chess-Project/backend/src/routes/internalDev.route.ts) | **Deleted** — throwaway M2 harness, superseded by real wiring |
| [`backend/src/matchmaking/__tests__/MatchmakingQueue.test.ts`](file:///d:/XLchess/Chess-Project/backend/src/matchmaking/__tests__/MatchmakingQueue.test.ts) | Extended — 5 new tests covering `onMatch`, compensation, and `enqueue()` correctness |
| [`backend/src/session/__tests__/matchmakingSessionBridge.test.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/__tests__/matchmakingSessionBridge.test.ts) | New — 2 integration tests covering real pairing → real session, and compensation on failure |

### 8. Upcoming Milestone Handoff / Follow-up Work (M4)

- **Milestone M4 — Results & Rating**:
  - Wire `SessionManager`'s existing `onResult` callback (already invoked at every terminal transition) to a new Results & Rating module — no `SessionManager` changes required, only a real listener replacing the current no-op default.
  - Persist game records and compute rating changes; Matchmaking reads ratings for a future rated-mode pairing strategy (Match Descriptor already carries `rated`/`ratingPoolId`).
  - Session must never block on Results (Invariant 14) — mirror the fire-and-forget pattern `onResult` already uses.

---

## Milestone M4 — Results & Rating

- **Status**: Completed & Frozen
- **Primary Goal**: Persist every terminal `GameResult` that `SessionManager` already emits, compute Elo rating changes for rated 2-player games, and expose game history / leaderboard reads — without ever modifying `SessionManager` itself or blocking the game loop on a database write.
- **Design document**: `m4_implementation_plan.md` (full database-impact analysis, field-by-field query-ability review, and the frozen rating-constants table referenced throughout this section).

### 1. Summary of Implementation

1. **The wiring gap this milestone closes**: `backend/src/index.ts` previously constructed `new SessionManager(undefined, undefined, sessionTransportImpl)` — the `onResult` parameter was `undefined`, so every completed multiplayer game was silently discarded. M4's only change to the composition root is replacing that `undefined` with `handleGameResult`, the real listener built below. `SessionManager.ts` itself is untouched.

2. **Persistence schema (`backend/prisma/schema.prisma`, additive)**:
   - `GameRecord` — one immutable row per terminal `GameResult`. Deliberately **not** named `GameSession` (the name `phase 3.1.md` originally suggested) because that name is already taken by the in-memory, never-persisted `GameSession` TS interface in `backend/src/session/types.ts` — reusing it would mean two unrelated things share one identifier across the codebase.
   - `GameParticipant` — join table resolving `GameResult.participants` into queryable rows, one per (game, user), carrying a precomputed `result: WIN | LOSS | DRAW` enum and (for rated games) `ratingBefore`/`ratingAfter`/`ratingDelta`.
   - `PlayerRating` — current Elo snapshot per `(userId, variantId)`, with an optimistic-concurrency `version` column.
   - Field typing followed one explicit rule throughout: *"will this ever be queried/filtered/sorted independently, or only displayed after loading one specific game?"* — `moveHistory`, `tournamentContext`, `metadata` stayed `Json?` (genuinely opaque, display-only); `timeControl` was split into real `initialSeconds`/`incrementSeconds`/`timeControlLabel` columns instead of a `Json?` blob, since those are exactly what a future "show my blitz games" filter needs.
   - Enum values (`GameTerminationReason`, `GameOutcomeKind`, `MatchProvenance`) match the frozen TS contract's union members verbatim — zero translation/mapping layer between Prisma and `backend/src/contracts/result.ts`.

3. **Results domain (`backend/src/results/`, new)**:
   - `ratingService.ts` — pure Elo math, zero I/O. Every constant is frozen and cited, not left to implementation-time judgment: `DEFAULT_RATING = 1200` (chess.com's well-known new-account default), `PROVISIONAL_K = 40` below 30 rated games / `ESTABLISHED_K = 20` at or above it (FIDE's own provisional-rating rule, not an invented number), the standard `400`-divisor expected-score formula, and the universal `0.5` draw score.
   - `resultsRepository.ts` — `persistGameResult(result)`. Writes `GameRecord` + `GameParticipant` rows in one Prisma `$transaction`; for rated, non-abort, exactly-2-participant games, also reads/computes/writes both sides' `PlayerRating` via optimistic-concurrency compare-and-swap (bounded 3-attempt retry on a version conflict — closes a real lost-update race if one user finishes two rated games in quick succession). Never throws to its caller: a duplicate write (`P2002` on the unique `gameSessionId`/`matchId` constraints) is treated as a benign no-op; every other failure is caught and reported via `reportError({ domain: "results", fatal: true, ... })`.
   - `resultsListener.ts` — `createResultsListener(persist)` returns a `(result: GameResult) => void` matching `ResultEmitter` exactly, wrapping the injected persist function in a detached, internally-`.catch()`-guarded promise chain. `handleGameResult = createResultsListener()` is the production instance wired into the composition root. The factory shape mirrors `SessionManager`'s own constructor-injection pattern (`onResult`/`variantResolver`/`transport`) and exists specifically so the decoupling invariant is unit-testable without mocking ES modules.
   - `index.ts` — barrel export.

4. **Read API (`backend/src/services/games.service.ts`, `backend/src/controllers/games.controller.ts`, `backend/src/routes/games.route.ts`, new)**: follows the same flat Route → Controller → Service → Prisma pattern already used by `opening`/`puzzle`/`user`/`payment` (not `matchmaking`'s newer colocated-in-domain-folder style), exactly as `phase 3.1.md` §6.7 specified for Results. Three endpoints, mounted at `/api/games` in `app.ts` and flag-gated behind `MULTIPLAYER_ENABLED` (503 when disabled, mirroring `matchmakingRouter`):
   - `GET /api/games/history/me` (`requireAuth`) — the authenticated user's own game history.
   - `GET /api/games/leaderboard/:variantId` — top-rated players for a variant, excluding accounts with fewer than 5 rated games (provisional accounts are tracked internally but not surfaced — prevents one early upset from producing a misleading week-one leaderboard entry).
   - `GET /api/games/:id` — a single finished game record with all participants.

5. **M0-AM-01 — `ROLLBAR_TOKEN` → `ROLLBAR_ACCESS_TOKEN` mismatch fixed (`backend/src/observability/rollbar.ts`)**:
   - `npm run build` failed before any M4 code was added: `rollbar.ts` referenced `env.ROLLBAR_TOKEN` in two places, but `backend/src/config/env.ts` has always defined (and required) `ROLLBAR_ACCESS_TOKEN`, matching the real `.env` file. This is a verified, build-blocking, pre-existing bug in frozen M0 code — confirmed via `git log`/`git status` showing zero uncommitted changes to either file before the fix. Fixed as a 2-line rename (`env.ROLLBAR_TOKEN` → `env.ROLLBAR_ACCESS_TOKEN`), preserving all existing graceful-degradation behavior exactly. Recorded here per AGENTS.md's Documentation Standards, mirroring how M1-AM-01/M1-AM-02 were recorded — this is a gap-fill against a verified defect, not a redesign.

6. **Pre-existing migration-history issue found and worked around, not fixed (`backend/prisma/migrations/`)**:
   - The local dev database (`127.0.0.1:54322`) was completely empty — no tables, no `_prisma_migrations` tracking table — and a pre-existing duplicate migration (`20260714121219`, already flagged in `database_architecture_audit.md` as an identical re-statement of `20260713200908`) blocked *any* clean fresh deploy of the 7 pre-existing migrations, not just the new M4 one. Resolved via `prisma migrate resolve --applied 20260714121219` (marks it satisfied in the tracking table without running its redundant SQL — no migration file was edited or deleted), then the remaining pre-existing migrations and the new `20260803153634_add_results_rating` migration were applied normally.
   - While diagnosing this, `prisma migrate diff` against the live database surfaced a **separate, unrelated, pre-existing gap**: `Course`, `Lesson`, `LessonProgress`, and `CustomLink` models exist in `schema.prisma` (and `CustomLink`/`LessonProgress` are documented in `database_architecture_audit.md` as actively used) but have **no migration file that ever created them** — meaning those tables do not exist in this local database at all. The diff also wanted to `DROP COLUMN`s from the actively-used `Opening` table to match an older shape recorded in `20260724180000_add_opening_model`. **Neither issue was touched.** Only the M4-scoped `CREATE TYPE`/`CREATE TABLE` statements were hand-extracted into the new migration file — nothing involving `Course`, `Lesson`, `LessonProgress`, `CustomLink`, or `Opening` was applied. This is flagged here for a future, separately-scoped migration-history review; it is unrelated to Results & Rating and was not created by this milestone.

### 2. Acceptance Criteria

1. **Wiring**: `handleGameResult` is the real `onResult` listener in the composition root; `SessionManager.ts` has zero line changes.
2. **Every terminal game persisted**: casual and rated, every `terminationReason`, produces a `GameRecord` with correct `GameParticipant` rows (including a correct `WIN`/`LOSS`/`DRAW` per side).
3. **Ratings correct and scoped**: `PlayerRating` updates only for rated, exactly-2-participant, non-`abort` games, using the frozen constants in `m4_implementation_plan.md` §2; all other terminal games persist history without touching ratings.
4. **Decoupling verified by test, not just by design**: `resultsListener.test.ts` proves `handleGameResult` never throws synchronously and produces no unhandled promise rejection even when persistence always rejects.
5. **Idempotency**: duplicate `gameSessionId`/`matchId` writes are rejected at the database level (`@unique`) and handled as a benign no-op, not a crash.
6. **Zero regression**: all 39 pre-existing M1–M3 tests pass unmodified; `MULTIPLAYER_ENABLED=false` behavior unchanged; `npm run build` — 0 errors; `npm test` — 48/48 pass (39 existing + 9 new: 6 rating-math, 3 decoupling).
7. **No `switch(variantId)` introduced** (Invariant 8) — the rating scope-check (`participants.length === 2`) is a participant-count check, not a variant branch.

### 3. Key Architectural & Implementation Decisions

- **`GameRecord`, not `GameSession`** — see §1.2. Avoids colliding with the frozen, in-memory `GameSession` type from M1.
- **Field granularity followed a single test, not a blanket "opaque → JSON" rule** — see §1.2 and `m4_implementation_plan.md` §1.8. `timeControl` was split into real scalar columns specifically because it's plausible-and-cheap to filter/sort on; `moveHistory`/`metadata`/`tournamentContext` stayed `Json?` because nothing outside the game they belong to will ever query them.
- **Elo, not Glicko-2** — Glicko-2 (what chess.com/Lichess actually run) needs per-player rating-deviation/volatility state and an iterative update; that's real complexity for a platform with zero rated games played. Elo is FIDE's own decades-long standard and is trivially auditable. Flagged as a legitimate future upgrade, not a day-one requirement.
- **Rating math scoped to 2-player games only** — the only registered `Variant` today (Chess960) is 2-player. A rated game with a different participant count is still persisted as a `GameRecord`; rating math is skipped with a non-fatal `reportError`, not a guess at an unspecified multi-side algorithm.
- **Optimistic concurrency over locking** — `PlayerRating.version` + bounded-retry compare-and-swap, rather than a database lock, closes the lost-update race if one user finishes two rated games in quick succession, using the same "retry the whole transaction" pattern rather than a nested-transaction workaround.
- **`resultsListener.ts`'s factory shape exists for testability, not layering for its own sake** — `createResultsListener(persist)` mirrors `SessionManager`'s existing injected-dependency pattern precisely so the "Session never blocks on Results" invariant can be unit-tested with a fake persister, instead of mocking ES module bindings.
- **Two pre-existing, unrelated bugs were found while building this milestone; only one was fixed** — the `ROLLBAR_TOKEN` mismatch directly blocked `npm run build` and was a trivial, behavior-preserving 2-line rename, so it was fixed and recorded as M0-AM-01. The missing `Course`/`Lesson`/`LessonProgress`/`CustomLink` migrations and the `Opening` schema drift do **not** block M4 and were left untouched, per Phase 3's cross-milestone isolation rule ("if additional work is discovered outside the current milestone, it should be documented rather than implemented unless it blocks progress").

### 4. Regression Guard

- **Do not modify `SessionManager.ts` for M5+**: M4 consumed the existing, frozen `onResult` callback exactly as designed — zero lines of `SessionManager.ts` changed.
- **`GameRecord`/`GameParticipant`/`PlayerRating` are the canonical persisted names** — future milestones must not introduce a differently-named persisted game-record model; consume these.
- **The rating constants in `m4_implementation_plan.md` §2 are frozen** — changing `DEFAULT_RATING`, the K-factor tiers, the provisional-games threshold, or the Elo divisor is a product/architecture decision requiring the same explicit review this milestone's design went through, not a casual tuning change.
- **`resultsListener.ts`'s synchronous, non-throwing, non-rejecting contract is load-bearing** — any future change to the Results write path must preserve `handleGameResult`'s `(result: GameResult) => void` signature and internal error-swallowing. Reintroducing an unguarded `async` listener would reopen the unhandled-rejection process-crash risk this milestone closes.
- **The missing `Course`/`Lesson`/`LessonProgress`/`CustomLink` migrations and `Opening` schema drift (§1.6) are not this milestone's to fix** — a future migration-history remediation must handle them explicitly and separately; M4 did not touch them and its migration contains nothing related to those models.

### 5. Public APIs & Frozen Contracts

```typescript
// Results — composition-root wiring
import { handleGameResult } from "./results/index.js";
new SessionManager(handleGameResult, undefined, sessionTransportImpl);

// Results — read accessors (internal, not HTTP)
import { persistGameResult, computeEloDelta, kFactorFor, DEFAULT_RATING } from "./results/index.js";

// Games HTTP API
GET /api/games/history/me          (requireAuth)  → { status, data: { history: GameParticipant[] } }
GET /api/games/leaderboard/:variantId             → { status, data: { leaderboard: PlayerRating[] } }
GET /api/games/:id                                → { status, data: { game: GameRecord } }
```

### 6. Consumed By / Dependency Map

| M4 Component | Consumed By (Downstream) |
|---|---|
| **`handleGameResult`** | Composition root only (`index.ts`) — the real `onResult` argument to `SessionManager`'s constructor |
| **`GameRecord` / `GameParticipant` / `PlayerRating` (Prisma models)** | `results/resultsRepository.ts` (writer), `services/games.service.ts` (reader) |
| **`ratingService.ts`'s frozen constants** | `resultsRepository.ts` only — no other domain computes ratings |
| **`gamesRouter`** | Composition root (`app.ts`) — mounted at `/api/games`; future frontend (M5) |
| **`PlayerRating` read data** | Future rated-mode Matchmaking pairing strategy (not wired in M4 — `MatchDescriptor`'s `rated`/`ratingPoolId` fields already support it, no contract change needed when that work happens) |

### 7. Primary File References (M4)

| File Path | Description |
|---|---|
| [`backend/prisma/schema.prisma`](file:///d:/XLchess/Chess-Project/backend/prisma/schema.prisma) | Extended: `GameRecord`, `GameParticipant`, `PlayerRating` models + 4 enums; `User` gains 2 optional back-relations |
| [`backend/prisma/migrations/20260803153634_add_results_rating/migration.sql`](file:///d:/XLchess/Chess-Project/backend/prisma/migrations/20260803153634_add_results_rating/migration.sql) | New — hand-scoped to M4's models only (see §1.6) |
| [`backend/src/results/ratingService.ts`](file:///d:/XLchess/Chess-Project/backend/src/results/ratingService.ts) | New — pure, frozen Elo math |
| [`backend/src/results/resultsRepository.ts`](file:///d:/XLchess/Chess-Project/backend/src/results/resultsRepository.ts) | New — the transactional writer; never throws to its caller |
| [`backend/src/results/resultsListener.ts`](file:///d:/XLchess/Chess-Project/backend/src/results/resultsListener.ts) | New — the real `onResult` listener; `createResultsListener()` factory for testability |
| [`backend/src/results/index.ts`](file:///d:/XLchess/Chess-Project/backend/src/results/index.ts) | New — barrel export |
| [`backend/src/services/games.service.ts`](file:///d:/XLchess/Chess-Project/backend/src/services/games.service.ts) | New — read-path Prisma queries |
| [`backend/src/controllers/games.controller.ts`](file:///d:/XLchess/Chess-Project/backend/src/controllers/games.controller.ts) | New — thin HTTP controller, matches `OpeningController` pattern |
| [`backend/src/routes/games.route.ts`](file:///d:/XLchess/Chess-Project/backend/src/routes/games.route.ts) | New — flag-gated router |
| [`backend/src/index.ts`](file:///d:/XLchess/Chess-Project/backend/src/index.ts) | Extended: imports `handleGameResult`, passes it as `SessionManager`'s `onResult` argument |
| [`backend/src/app.ts`](file:///d:/XLchess/Chess-Project/backend/src/app.ts) | Extended: mounts `gamesRouter` at `/api/games` |
| [`backend/src/observability/rollbar.ts`](file:///d:/XLchess/Chess-Project/backend/src/observability/rollbar.ts) | Fixed (M0-AM-01): `env.ROLLBAR_TOKEN` → `env.ROLLBAR_ACCESS_TOKEN` |
| [`backend/src/results/__tests__/ratingService.test.ts`](file:///d:/XLchess/Chess-Project/backend/src/results/__tests__/ratingService.test.ts) | New — 6 tests, frozen Elo constants |
| [`backend/src/results/__tests__/resultsListener.test.ts`](file:///d:/XLchess/Chess-Project/backend/src/results/__tests__/resultsListener.test.ts) | New — 3 tests, the decoupling invariant |
| [`m4_implementation_plan.md`](file:///d:/XLchess/Chess-Project/m4_implementation_plan.md) | Design document — database impact analysis, field-by-field query-ability review, frozen rating constants |

### 8. Upcoming Milestone Handoff / Follow-up Work (M5)

- **Milestone M5 — Play Chess Vertical (E2E UI & Flagged Rollout)**:
  - Build the thin frontend (`MatchmakingContext`, `GameSessionContext`, `PlayChessPage`) that drives the full loop: queue → match → play → result → rating, consuming `GET /api/games/history/me` and `GET /api/games/leaderboard/:variantId` for history/leaderboard display.
  - Backward-compat verification: existing Chess960-vs-Stockfish mode must remain functionally unchanged.
- **Not part of M5, flagged for a separate future pass**: the pre-existing missing migrations for `Course`/`Lesson`/`LessonProgress`/`CustomLink` and the `Opening` schema drift found in §1.6 — unrelated to Results & Rating, needs its own scoped review.

---

## Backend Stabilization (Pre-M5)

- **Status**: Completed & Verified
- **Primary Goal**: Close small, verified gaps in the frozen M0–M4 transport/session/matchmaking code around M5 frontend work. **This is not a milestone and introduces no new features, contracts, or architecture** — it is an amendment pass in the same spirit as M1-AM-01/M1-AM-02/M0-AM-01, surfaced while producing the M5 frontend design plan (`m5_implementation_plan.md` §0) and, for AM-05, while live-testing M5 with two real accounts after it shipped. Each item below was a verified defect or missing wiring, not a design preference.

### 1. Summary of Implementation

1. **AM-01 — Resign Transport Bridge (`backend/src/session/sessionTransportBridge.ts`)**:
   - **Problem**: `SessionManager.forfeit(sessionId, userId)` already existed, already produced a correct `GameResult` (`terminationReason: "forfeit"`), and M4 already persisted it correctly — but `wireSessionTransportBridge`'s `onAppMessage` hook began with `if (message.type !== "submit_move") return;`, so a client `resign` message was silently dropped. There was no way for a player to end a game except letting the connection drop and waiting out the existing 30s participant-grace timer into the same `forfeit()` path.
   - **Fix**: `onAppMessage` now also accepts `message.type === "resign"`, resolves the sender's `sessionId` via the existing `getSessionIdForParticipant()` lookup (identical to the `submit_move` path), and calls `sessionManager.forfeit(sessionId, userId)` directly. A `resign` from a user with no active session gets the same informative `{type:"error", payload:{reason:"no_active_session"}}` reply and non-fatal `reportError()` that `submit_move` already used — no new error path was invented.
   - **Scope discipline**: `SessionManager.ts` was not touched — `forfeit()` is called exactly as it already existed. Results and the `GameResult` contract were not touched.

2. **AM-02 — Reconnect Heartbeat Fix (`backend/src/transport/ConnectionManager.ts`, `backend/src/transport/TransportServer.ts`)**:
   - **Problem (verified defect)**: `Connection.id` (the `ConnectionId`) never changes across a reconnect — `markReconnected()` keeps the original `conn.id` and only swaps the `ws` reference. But `TransportServer.ts`'s fresh-connection path set `currentConnId = connectionId` (a real `ConnectionId`) while its reconnect path set `currentConnId = parsed.resumeToken` (a `ResumeToken`) — a different value space entirely, since `ConnectionManager.connections` is keyed by `ConnectionId`, not `ResumeToken`. Every `ws.on("pong")` → `connectionManager.recordPong(currentConnId)` call after a reconnect looked up a key that was never in the `connections` map, so `lastPongAt` silently stopped updating. `HeartbeatTicker`'s 30s pong-timeout then killed the (actually-alive) connection roughly 30 seconds after every reconnect, and the subsequent `ws.on("close")` → `connectionManager.disconnect(currentConnId)` call had the same wrong-key problem, so `Session` was never even told the participant disconnected.
   - **Fix**: `ConnectionManager.markReconnected()` now returns `ConnectionId | null` (the real, persistent `conn.id` on success, `null` on failure) instead of `boolean`. `TransportServer.ts`'s reconnect branch now does `currentConnId = reconnectedId` (the returned `ConnectionId`) instead of `parsed.resumeToken`. `recordPong`/`disconnect` now always operate on the same persistent identity the connection has held since `register()`, across any number of reconnects.
   - **Scope discipline**: `ReconnectBuffer`, resume-token generation/lookup, replay-on-reconnect, and `SessionManager` are all unchanged. This is a one-value return-type correction plus a one-line caller fix — no redesign of reconnect architecture.

3. **AM-03 — Presence Updates (`backend/src/session/SessionManager.ts`)**:
   - **Problem**: `notifyParticipantConnected()`/`notifyParticipantDisconnected()` already correctly interpret Transport's presence facts (updating the in-memory `presence` Set, starting/clearing grace timers, driving `PAUSED`↔`PLAYING`) but never broadcast any of it. A client had no wire signal at all for "opponent disconnected" or "opponent reconnected" — the only presence-adjacent broadcasts were the pre-existing `state_update`s on `WAITING→READY` and `PAUSED→PLAYING`.
   - **Fix**: a new private `broadcastPresence(session, userId, connected)` sends `{type: "presence_update", payload: {userId, connected}}` to every participant via the existing, unmodified `SessionTransport.broadcast()` — the same generic `{type, payload}` shape `state_update` and `game_over` already use. It is called once at the top of `notifyParticipantConnected()` (unconditionally, before the status-based branching) and once at the top of `notifyParticipantDisconnected()` (right after the existing early-return guard, so it fires for `WAITING`/`READY`/`PLAYING` exactly where presence bookkeeping already runs) — including the case where a disconnect drives the session into `PAUSED`, which previously produced no broadcast whatsoever.
   - **Scope discipline**: the payload is deliberately minimal — `{userId, connected}` only. No session status, grace-timer state, or other internal bookkeeping is exposed. **No contract change**: `SessionTransport`'s `broadcast(userIds, message: {type: string; payload: unknown})` signature was already generic enough for a new `type` value; nothing in `contracts/` was touched. No authority moved to the client — the client only receives a fact Session already computed and already owned.

4. **AM-04 — Development WebSocket Proxy (`frontend/vite.config.ts`)**:
   - **Problem**: Vite's dev server proxied `/api` to `localhost:3000` but had no entry for `WS_PATH` (`/ws`), so a WebSocket upgrade from the frontend dev server never reached the backend locally.
   - **Fix**: added a `'/ws': { target: 'ws://localhost:3000', ws: true, changeOrigin: true }` entry alongside the existing, untouched `/api` entry — exactly what `phase 3.1.md` §5.7/§8.7 already specified for this milestone boundary. Local development only; no production config (`vercel.json`) touched.

5. **AM-05 — Matchmaking Identity (`backend/src/matchmaking/matchmaking.route.ts`, `backend/src/matchmaking/matchmaking.controller.ts`)**:
   - **Problem (verified defect, found live)**: discovered while testing M5 end-to-end with two real, differently-signed-in Google accounts in two browsers — both enqueued as the literal string `dev-user-anonymous`, so they collapsed into one ticket and could never pair. Root cause was two compounding bugs: (1) `matchmaking.route.ts` mounted no `requireAuth` middleware — unlike `games.route.ts`'s `/history/me` — so nothing ever populated `req.user` for a matchmaking request, authenticated or not; (2) even had it been mounted, `getUserIdFromRequest()` read `(req as any).auth`, a field that `requireAuth` never sets and that no middleware anywhere in this codebase sets — every other authenticated controller (`games`, `payment`, `user`, `customLinks`) correctly reads `req.user?.id` instead. The `x-user-id` header / `dev-user-anonymous` fallback chain masked both bugs completely, since it always produced *a* valid-looking ticket.
   - **Fix**: `requireAuth` added before all three matchmaking route handlers (`POST /queue`, `DELETE /queue/:ticketId`, `GET /queue/:ticketId`), identical placement to `games.route.ts`. `getUserIdFromRequest()` changed to read `req.user?.id` first, matching the one real convention already used everywhere else. The `x-user-id` header fallback and `dev-user-anonymous` default are left in the function body (now unreachable through the HTTP route, since `requireAuth` rejects first) rather than deleted, since removing them wasn't the fix being made and they're harmless dead code, not active behavior.
   - **Scope discipline**: `MatchmakingQueue.ts`'s pairing/ticket logic, `MatchDescriptor`, and every other route are untouched. This is a two-line identity-resolution correction, not a redesign of matchmaking's HTTP surface.

### 2. Acceptance Criteria

1. **AM-01**: a `resign` WebSocket message from a session participant calls `SessionManager.forfeit()` for that participant's session, unchanged from its existing behavior — verified by `session/__tests__/sessionTransportBridge.test.ts` (new): forfeits and emits the correct `GameResult` (`terminationReason: "forfeit"`, correct winning side); a `resign` from a user with no active session is rejected informatively, never thrown; unrelated message types remain ignored.
2. **AM-02**: `ConnectionManager.markReconnected()` returns the connection's real, persistent `ConnectionId`; `recordPong()`/`disconnect()` called with that id operate on the live connection — verified by a new regression test in `transport/__tests__/ConnectionManager.test.ts` (`recordPong and disconnect operate correctly on the id returned by markReconnected`), which fails against the pre-fix code (the old `boolean` return gave the caller nothing to key `recordPong`/`disconnect` off of except the wrong `resumeToken`). Live-verified: backend started with `MULTIPLAYER_ENABLED=true`, confirmed listening and serving `/api/matchmaking/queue` (`201`) and bootstrapping `WebSocket server ... on path '/ws'` with the changed code in place; a full 30+ second two-authenticated-client reconnect soak was not run in this pass (would require a real Auth.js session, impractical to script headlessly) — the unit-level regression test isolates and proves the exact mechanism that was broken.
3. **AM-03**: `notifyParticipantConnected`/`notifyParticipantDisconnected` broadcast `{type: "presence_update", payload: {userId, connected}}` to all participants — verified by a new test in `session/__tests__/SessionManager.presence.test.ts` asserting the exact minimal payload shape (`{userId, connected}`, no other keys) for both a connect and a disconnect, delivered to every participant.
4. **AM-04**: `/ws` is proxied in `vite.config.ts` — **live-verified**: with the backend running (`MULTIPLAYER_ENABLED=true`) and the frontend dev server serving the changed config, a raw browser `WebSocket("ws://localhost:5173/ws")` successfully opened and was closed by the **backend's own** unauthenticated-handshake gate (`4401 Unauthorized`, `TransportServer.ts`'s `authenticate()`), proving the upgrade actually tunneled through Vite to the real backend WS server rather than failing to connect.
5. **AM-05**: an unauthenticated `POST /api/matchmaking/queue` now returns `401 {"status":"fail","message":"Unauthorized. Please sign in."}` instead of silently enqueueing as `dev-user-anonymous` — **live-verified** by curl against the running backend. `getUserIdFromRequest()` now resolves the same way `GamesController`/`PaymentController`/`UserController`/`CustomLinksController` already do (`req.user?.id`). Discovered and fixed during real two-account testing of M5; not caught by any existing automated test since none construct a request with `req.user` set.
6. **Zero regression**: all 48 pre-existing M1–M4 tests pass unmodified in behavior; **53 total pass** (48 existing + 3 new AM-01 + 1 new AM-02 regression + 1 new AM-03; AM-04/AM-05 have no new automated tests — see their own Regression Guard entries for why). Two pre-existing `ConnectionManager.test.ts` reconnect assertions were updated in place (not added) to check `markReconnected`'s new `ConnectionId | null` return value instead of `boolean` — same test, same behavior verified, updated assertion only. `npm run build` (backend) — 0 errors, re-confirmed after AM-05. `MULTIPLAYER_ENABLED=false` behavior unchanged (routes still 503, Transport still doesn't bootstrap — untouched by any of the five amendments).

### 3. Key Architectural & Implementation Decisions

- **All five are amendments, not redesigns** — each closes a single verified gap in already-frozen M1–M2 code (Phase 3's own amendment criteria: fixes a verified bug/gap, removes a blocking issue, preserves all existing behavior, is explicitly documented here). None reopens a frozen contract: `MatchDescriptor`, `VariantContract`, and `GameResult` are byte-identical to M4.
- **AM-02's return-type change (`boolean` → `ConnectionId | null`) is the one visible API shift**, and it is confined to `ConnectionManager.markReconnected()`, an internal Transport-module method with exactly one caller (`TransportServer.ts`) — not one of the three frozen inter-domain contracts in `backend/src/contracts/`. Explicitly not a breaking change to anything M2–M4 depend on: `SessionManager`, `sessionTransportBridge.ts`, and `matchmakingSessionBridge.ts` never call it.
- **AM-03's payload is intentionally minimal by design, not by omission** — `{userId, connected}` is exactly the fact `SessionManager`'s existing `presence` Set already tracks; session status, grace-timer countdowns, and `PAUSED` semantics remain server-side-only knowledge, available to the client only through the pre-existing `state_update`/`game_over` broadcasts.
- **AM-05 is a convention-consistency fix, not a new auth pattern** — `requireAuth` and `req.user` already existed and were already the established way every other authenticated route in this codebase resolves identity; matchmaking was the one outlier that never adopted it, apparently since M1. Nothing new was invented.
- **The `x-user-id` header / `dev-user-anonymous` fallback in `getUserIdFromRequest()` was deliberately left in place, not deleted** — it's dead code through the HTTP route now that `requireAuth` rejects first, but removing it is a separate cleanup decision outside what AM-05 set out to fix.
- **Draw offers, rated matchmaking, and any matchmaking-algorithm change were explicitly out of scope** and are not touched by this pass — they require new session state and/or new contract fields, which is feature work for a future milestone, not a stabilization amendment.

### 4. Regression Guard

- **Do not treat this as M5 or fold it into M5's frontend history** — it precedes/surrounds M5 and is scoped purely to backend transport/session/matchmaking wiring. M5's own README section references these amendments rather than restating them, and is not retroactively rewritten by AM-05 even though AM-05 was found while testing M5 (per this document's own "never rewrite previous milestone history" rule).
- **`SessionManager.forfeit()`'s behavior, signature, and `GameResult` shape are unchanged** — AM-01 only added a new caller of the existing method.
- **`ConnectionManager.markReconnected()`'s new `ConnectionId | null` return type is now load-bearing** — any future change to Transport's reconnect handshake must preserve returning the connection's real, persistent id (or an equivalent), not reintroduce a bare success boolean divorced from connection identity.
- **`presence_update`'s payload shape (`{userId, connected}`) is the minimal contract future frontend code should rely on** — do not have the frontend infer additional meaning (session status, grace deadlines) from this message; those remain in `state_update`/`game_over`.
- **The `/ws` Vite proxy entry is local-development-only** — production WebSocket traversal (Vercel → Railway) remains the separate, already-tracked concern in `phase 3.1.md` §5.8/§8.8; this pass does not touch `vercel.json`.
- **Matchmaking routes now require auth, permanently** — any future matchmaking endpoint added to `matchmaking.route.ts` must also mount `requireAuth`, or it silently reopens the anonymous-collapse bug. `getUserIdFromRequest()` must keep reading `req.user?.id` first; do not revert to `req.auth`, which nothing in this codebase populates.
- **Still not fixed, still flagged from M4 §1.6**: the missing `Course`/`Lesson`/`LessonProgress`/`CustomLink` migrations and `Opening` schema drift remain untouched and unrelated to this pass — this is exactly the gap that produced the unrelated `500` on `GET /api/custom-links` seen during the same live test that found AM-05.

### 5. Public APIs & Contracts Introduced

```typescript
// AM-02 — ConnectionManager: return type changed (internal Transport API, not a frozen contract)
connectionManager.markReconnected(resumeToken, lastReceivedSeq, newWs): ConnectionId | null
// was: markReconnected(...): boolean

// AM-01 — sessionTransportBridge: onAppMessage now also handles "resign"
// { type: "resign", payload: {} }  ->  sessionManager.forfeit(sessionId, userId)

// AM-03 — SessionManager: new outbound broadcast type (uses the existing generic
// SessionTransport.broadcast(userIds, {type, payload}) shape — no interface change)
// { type: "presence_update", payload: { userId: string; connected: boolean } }

// AM-05 — matchmaking routes now require auth; identity resolution corrected
// POST /api/matchmaking/queue, DELETE /queue/:ticketId, GET /queue/:ticketId
// now: requireAuth -> req.user.id populated -> getUserIdFromRequest() reads req.user?.id
// was: no requireAuth; getUserIdFromRequest() read (req as any).auth (never set) -> "dev-user-anonymous"
```

### 6. Consumed By / Dependency Map

| Component | Consumed By (Downstream) |
|---|---|
| **AM-01 resign routing** | M5's `GameActionBar` resign control |
| **AM-02 `markReconnected` return value** | `TransportServer.ts` only (its sole caller) |
| **AM-03 `presence_update` broadcast** | M5's `ConnectionIndicator` / opponent-presence UI — resolves the gap `m5_implementation_plan.md` §0 flagged as **B4** |
| **AM-04 `/ws` Vite proxy** | Local frontend dev server only |
| **AM-05 corrected `req.user` identity** | Every matchmaking HTTP call M5's `MatchmakingService` makes — real two-account matching depends entirely on this |

### 7. Primary File References

| File Path | Description |
|---|---|
| [`backend/src/session/sessionTransportBridge.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/sessionTransportBridge.ts) | AM-01: routes `resign` to `SessionManager.forfeit()` |
| [`backend/src/transport/ConnectionManager.ts`](file:///d:/XLchess/Chess-Project/backend/src/transport/ConnectionManager.ts) | AM-02: `markReconnected()` returns `ConnectionId \| null` |
| [`backend/src/transport/TransportServer.ts`](file:///d:/XLchess/Chess-Project/backend/src/transport/TransportServer.ts) | AM-02: tracks `currentConnId` by the returned `ConnectionId` on reconnect |
| [`backend/src/session/SessionManager.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/SessionManager.ts) | AM-03: new private `broadcastPresence()`, called from `notifyParticipantConnected`/`Disconnected` |
| [`frontend/vite.config.ts`](file:///d:/XLchess/Chess-Project/frontend/vite.config.ts) | AM-04: added `/ws` proxy entry (dev-only) |
| [`backend/src/matchmaking/matchmaking.route.ts`](file:///d:/XLchess/Chess-Project/backend/src/matchmaking/matchmaking.route.ts) | AM-05: `requireAuth` added to all three routes |
| [`backend/src/matchmaking/matchmaking.controller.ts`](file:///d:/XLchess/Chess-Project/backend/src/matchmaking/matchmaking.controller.ts) | AM-05: `getUserIdFromRequest()` reads `req.user?.id` |
| [`backend/src/session/__tests__/sessionTransportBridge.test.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/__tests__/sessionTransportBridge.test.ts) | New — 3 tests covering AM-01 |
| [`backend/src/transport/__tests__/ConnectionManager.test.ts`](file:///d:/XLchess/Chess-Project/backend/src/transport/__tests__/ConnectionManager.test.ts) | Extended — 2 existing reconnect assertions updated for the new return type; 1 new regression test for AM-02 |
| [`backend/src/session/__tests__/SessionManager.presence.test.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/__tests__/SessionManager.presence.test.ts) | Extended — 1 new test for AM-03 |
| [`m5_implementation_plan.md`](file:///d:/XLchess/Chess-Project/m5_implementation_plan.md) | The M5 design plan whose §0 backend-reality-check first surfaced B1/B3/B4/B9/B11 — AM-05 closes **B9** |

### 8. Upcoming Milestone Handoff / Follow-up Work (M5)

- M5 frontend work can now build the resign control, reconnect UI, and opponent-presence indicator against real wire behavior instead of the previously-blocked/degraded states `m5_implementation_plan.md` §0 and §5 described.
- **AM-05 has no dedicated automated test yet** — a future pass should add an integration test asserting `POST /api/matchmaking/queue` 401s without a session and resolves `req.user.id` correctly with one, mirroring the existing `MatchmakingQueue.test.ts` style.
- **Not addressed here, still open**: draw offers (no backend mechanism exists — `m5_implementation_plan.md` §0 **B2**), rated matchmaking (`rated: false` hard-coded in `MatchmakingQueue.tryPair()` — **B6**), opponent display name/avatar (no public user-lookup endpoint — **B8**), and premove (server rejects out-of-turn moves outright by design — **B10**). None of these block M5; each is recorded as a closed decision or a future feature, not a stabilization gap.

---

## Milestone M5 — Play Chess Vertical (E2E UI, Frontend-Only)

- **Status**: Completed & Verified (frontend). Live two-authenticated-client socket play-through not run in this pass — see §2.
- **Primary Goal**: Build the thin, real-time Play Chess UI — matchmaking queue, live game, and result — driving the full loop (queue → match → play → result → history) against the exact wire contracts M0–M4 and the Backend Stabilization pass (AM-01–AM-04) already froze. **Zero backend files were touched.** Design methodology and the full pre-build audit (token inventory, component audit, state × screen matrix, accessibility/responsive strategy) are recorded in full in `m5_implementation_plan.md`; this section is the as-built implementation record.

### 1. Summary of Implementation

1. **Types & services (`frontend/src/types/multiplayer.ts`, `frontend/src/services/`)**:
   - `types/multiplayer.ts` mirrors the frozen backend contracts (`MatchDescriptor`, `GameResult`, `SessionStatus`, `TerminationReason`, the `OutboundMessage`/`InboundMessage` wire shapes) as client-side types only — no logic, no divergence from the backend's own `contracts/`.
   - `services/matchmaking.service.ts` — thin HTTP client for `POST/DELETE/GET /api/matchmaking/queue*`, following the existing static-class pattern (`PaymentService`, `OpeningService`). Exports `MultiplayerDisabledError` (503) and `TicketNotFoundError` (404) as typed errors so callers can branch on the exact backend state rather than string-matching.
   - `services/games.service.ts` — thin client for `GET /api/games/history/me` and `GET /api/games/leaderboard/:variantId`, matching `GamesController`'s real `{status, data: {...}}` response shape exactly (verified against `backend/src/controllers/games.controller.ts`).

2. **State: two new contexts, each split into an instance file + provider component (`frontend/src/context/`)**:
   - `gameSessionContext.instance.ts` / `GameSessionContext.tsx` — owns the WebSocket connection for one live game. Sends the initial handshake, tracks `resumeToken`/`lastReceivedSeq`, mirrors `descriptor` + those two values to `sessionStorage` (key `xlchess.mp.session`) so a page refresh mid-game reconnects and rejoins directly into the game view — there is no `GET /api/session/:id` to rehydrate from, so the descriptor itself has to be cached, not just the token. Reconnects with a capped exponential backoff (`1s → 2s → 4s → 8s → 15s`). Exposes `startGame`, `submitMove`, `resign`, `leaveGame`. Never computes a game outcome or clock expiry itself — every field it exposes (`sessionState`, `gameResult`, `presence`) is a direct mirror of the last `state_update`/`game_over`/`presence_update` the server sent.
   - `matchmakingContext.instance.ts` / `MatchmakingContext.tsx` — owns the queue ticket lifecycle only (`enqueue` → poll every 1.2s → `MATCHED`/`CANCELLED`/`EXPIRED`). Hands the `MatchDescriptor` to `GameSessionContext` exactly once, at the match-found boundary, mirroring the backend's own one-way `MatchmakingQueue → SessionManager` handoff. Never imports or references `GameSessionContext`.
   - Both contexts are consumed via `hooks/useGameSession.ts` / `hooks/useMatchmaking.ts`, matching the existing `useSession()` pattern.
   - **Why split into an instance file**: `react-refresh/only-export-components` flags a `.tsx` file that exports both a component and a plain value (the `createContext()` object) — `SessionContext.tsx` and `BoardSettingsContext.tsx` already have this exact same lint error today (pre-existing, unrelated to M5, left untouched). M5's two new contexts don't repeat it: `gameSessionContext.instance.ts`/`matchmakingContext.instance.ts` hold only the `createContext()` call and its type; the `.tsx` files export only their Provider component.

3. **The signature element — `SideClock.tsx` ("Flagfall")**: the clock is the sole turn indicator (no separate "your turn" badge anywhere). `remainingMs`/`lastMoveAt` are the server's own clock snapshot; `displayMs` is recomputed fresh on every render from wall-clock time, never stored as derived state — the one effect present only schedules the *next* render (via a deferred `setTimeout`, tuned to 1Hz above 30s / 10Hz below) and never calls `Date.now()` or `setState` synchronously from its own body, satisfying `react-hooks/purity` and `react-hooks/set-state-in-effect` simultaneously. Below 30s the display switches from `m:ss` to tenths (`29.4`); below 10s a 1px hairline sweeps the plate once a second (`.clock-flag-sweep`, reusing the existing `.hero-rule` gradient idiom); at 0 the plate inverts (`.clock-plate--flagged`) and freezes. The client never declares a flag — `game_over` is the only authority for that.

4. **Board (`components/play/MultiplayerBoard.tsx`)**: renders the server FEN through the existing, mandated `ThemedChessboard` (inherits board theme/piece set/click-to-move for free). A locally-predicted "optimistic" FEN may render for up to 3s after a drop, but the next `state_update` or `move_rejected` always wins and replaces it outright — never merged, never trusted as truth. The move actually played is derived by diffing the previous server FEN against the new one using the identical `chess.js` version the backend runs; verified byte-identical against the real backend's `generateStartingFen()` for 5 Chess960 position IDs including both edge cases (0, 959) via a throwaway comparison script (removed after verification). Replicates the same Chess960 "king dropped onto own rook = castle" gesture translation `useChess960Game.ts` already does for the local mode — necessary duplication, not an oversight, per the same reasoning Phase 3 §6 already uses for client/server rules duplication.

5. **Remaining components (`components/play/`)**: `PlayerPanel` (identity + presence + clock merged into one row — the same markup works stacked-mobile and side-by-side-desktop with zero special-casing), `OpponentIdentity` (a deterministic crest hashed from `userId`, split across the viewer's own board-theme colors — never a fabricated name, since no public user-lookup endpoint exists), `ConnectionIndicator` (glyph + word, never color alone), `GameActionBar` (two-step resign confirm; draw offer rendered `aria-disabled` with a real, honest reason — no backend mechanism exists), `LiveRegion` (the single `aria-live` announcer), `QueuePanel`/`MatchFoundCard`/`LobbyView` (queue states + the match-found handoff, which renders the actual Chess960 starting position via a small ported Scharnagl generator, `utils/chess960PositionId.ts`), `ResultRevealModal` (grows out of the board reusing `.checkmate-overlay-badge`; states "Casual · Rating Unaffected" rather than inventing a live rating delta, since `GameResult` carries none — Results computes ratings asynchronously, decoupled from Session's broadcast by design), `GameHistoryList`/`LeaderboardPanel` (consume the real M4 read endpoints; render the honest empty states since every game is casual today).

6. **Assembly & wiring**: `pages/PlayChessPage.tsx` is a pure state-machine shell (lobby → match-found → game, no route param — `PlayChessGame` is rendered `key={descriptor.matchId}` so a new game is a clean remount with no manual state-reset effect needed). `router/routes.tsx` gained `/play/chess` wrapped in `ProtectedRoute`. `main.tsx` gained `MatchmakingProvider`/`GameSessionProvider` nested inside `SessionProvider`, above `BoardSettingsProvider` (the order `phase 3.1.md` §5.5 specifies). `components/SidebarLayout.tsx` gained a "Play Online" entry in `exploreSection`. `index.css` gained four additive `--dur-*` motion-duration tokens (durations were the one un-tokenized gap in the existing design system; easings were already tokenized) plus the `.clock-flag-sweep`/`.clock-plate--flagged`/`.reveal-in` rules, all with `prefers-reduced-motion` substitutes (a static bar, not just suppression).

7. **ESLint compliance**: all 24 new/modified files pass `eslint` (project's `reactHooks.configs.flat.recommended`) with zero errors, zero warnings. Beyond the context-file split (item 2), the other fixes were: `MultiplayerBoard`'s move-rejection handler gained a ref-gated dedup (`handledRejectionIdRef`) matching the same "compare against a ref of the previous value" shape the linter already accepts elsewhere in the file; `GameHistoryList` dropped an internal loading-state reset in favor of `LobbyView` forcing a refetch via `key={historyRefreshKey}`; `PlayChessGame`'s game-over announcement became a derived render-time value (`gameResult ? "Game over." : assertiveMessage`) instead of stored state; `GameSessionContext`'s refresh-rehydration moved from an effect-triggered `setDescriptor` to `useState`'s lazy initializer (a genuine "read from an external source once" case, not a reactive sync).

### 2. Acceptance Criteria

1. **`tsc -b --noEmit`**: 0 errors. **`npm run build` (frontend)**: 0 errors (pre-existing chunk-size warning only, unrelated to M5).
2. **ESLint**: 0 errors, 0 warnings across all 24 new/modified files.
3. **Backward-compat gate (Phase 3 §6, non-negotiable)**: `useChess960Game.ts`, `useStockfish.ts`, `GameBoard.tsx`, `GameControls.tsx`, `GameStatusBanner.tsx`, `types/chess.ts` — zero diff (confirmed via `git status`). `/play/chess960` live-verified in-browser twice in this pass (before and after the ESLint restructuring), zero console errors both times.
4. **`/play/chess` auth gate**: live-verified — an unauthenticated request redirects to `/?login=true` via the existing `ProtectedRoute`, zero console errors.
5. **HTTP matchmaking flow**: live-verified against the real backend (`MULTIPLAYER_ENABLED=true`) — two queued tickets (`x-user-id` header, since the matchmaking route itself has no `requireAuth` — a pre-existing gap, **B9**, unrelated to M5) produced a real `MatchDescriptor` with a live `positionId`.
6. **FEN parity**: the ported `generateStartingFenFromPositionId()` (frontend) produced byte-identical output to the backend's `generateStartingFen()` for `positionId` ∈ {0, 42, 518, 773, 959}.
7. **Not run in this pass**: a full two-real-Google-account, live-socket queue→match→play→result loop. This environment has no dev auth bypass and the WebSocket handshake authenticates strictly via a real Auth.js database session (`TransportServer.ts`'s `authenticate()`) — scripting around real Google OAuth was out of scope. Everything reachable without live auth (types, build, lint, the HTTP matchmaking flow, FEN generation, backward-compat, the auth gate itself) is verified above; the live two-client play-through is the one item a human needs to click through.
8. **`MULTIPLAYER_ENABLED=false` surface**: not re-verified live in this pass, but is a designed, first-class state (not an error path) — `MatchmakingService`/`GamesService` both throw a typed `MultiplayerDisabledError` on `503`, and every consumer (`QueuePanel`, `GameHistoryList`, `LeaderboardPanel`) renders a specific "not open yet" / honest-empty copy for it, never a crash or a generic toast.

### 3. Key Architectural & Implementation Decisions

- **`GameBoard.tsx`/`GameControls.tsx`/`GameStatusBanner.tsx` were deliberately not extended.** All three type against the client-only `types/chess.ts` union (`GameStatus`, the local `GameResult` string union — a different, unrelated type from the backend's `GameResult` contract despite the name collision) and belong to the frozen Stockfish mode. Widening any of them with multiplayer conditionals would put real-time state inside the backward-compat gate. `MultiplayerBoard`/`GameActionBar`/`ResultRevealModal` are net-new, composing the same underlying primitives (`ThemedChessboard`, `BoardCoordinates`, `soundManager`, the `.checkmate-overlay-badge`/`.btn-premium-cta` visual idioms) instead.
- **No client-side rating delta at game-end, by design, not by gap.** The frozen `GameResult` contract carries no rating fields at all — `resultsRepository.persistGameResult()` computes and writes `PlayerRating` asynchronously, decoupled from `SessionManager`'s broadcast (Session must never block on Results). `ResultRevealModal` states this honestly (`"Casual · Rating Unaffected"` today; a dormant `"Rated · Rating updates shortly"` branch for when `rated` ever becomes `true`) rather than inventing a number the wire never sends.
- **No rematch offer.** Matchmaking only does FCFS pairing against the live queue — there is no concept of "the same opponent again." A `Rematch` button would silently re-queue into a random new opponent, which would be a lie about what it does. The result CTA is `Find Another Game`, which is what actually happens.
- **The optimistic move overlay lives only in `MultiplayerBoard`'s local state** — never lifted into `GameSessionContext`, never read by `SideClock` or the move log. It is unconditionally destroyed by the next server message, satisfying the plan's "no client state duplicating server-owned state" rule with one explicit, tightly-scoped exception.
- **`key`-based remounting over reset-effects**, applied twice (`PlayChessGame` keyed on `matchId` from `PlayChessPage`; `GameHistoryList` keyed on `historyRefreshKey` from `LobbyView`) — the React-idiomatic way to reset all of a component's state when the "which thing is this" identity changes, and it happens to be exactly what satisfies `react-hooks/set-state-in-effect` without any suppression.

### 4. Regression Guard

- **Zero backend files were changed by M5** — verified via `git status --short backend/` showing no diff. Any future fix to the four items below is backend work, out of M5's own scope, and must land as its own reviewed change.
- **Do not extend `GameBoard.tsx`/`GameControls.tsx`/`GameStatusBanner.tsx`/`useChess960Game.ts`/`useStockfish.ts`/`types/chess.ts` for multiplayer purposes** — they are the frozen backward-compat surface; `components/play/Multiplayer*`/`SideClock`/`PlayerPanel`/etc. are the parallel multiplayer-only surface and must stay separate.
- **`GameResult`/`MatchDescriptor`/the WS message shapes are consumed exactly as frozen** — `types/multiplayer.ts` is a mirror, not a modification; if the backend contracts ever change, this file must be updated to match, not the other way around.
- **Do not have the frontend infer state beyond what a message actually carries** — e.g. `presence_update`'s `{userId, connected}` is rendered as-is; no grace-timer countdown is fabricated client-side (the server never sends a deadline), and no rating delta is fabricated at game-end (the server never sends one there either).
- **The four still-open backend gaps are unchanged by M5 and remain someone else's future work, not silently worked around**: draw offers (**B2**, no backend mechanism), rated matchmaking (**B6**, `rated: false` hard-coded in `MatchmakingQueue.tryPair()`), opponent display name/avatar (**B8**, no public user-lookup endpoint), premove (**B10**, server rejects out-of-turn moves outright by design). `GameActionBar`'s draw control and `OpponentIdentity`'s pseudonym are the UI's honest acknowledgment of B2/B8, not a workaround.
- **`sessionStorage` key `xlchess.mp.session`** (descriptor + resumeToken + lastReceivedSeq) is the refresh-rehydration mechanism; a future change to the reconnect handshake must keep writing/reading this exact shape or provide an equivalent, since there is still no `GET /api/session/:id` to fall back on.

### 5. Public APIs & Frozen Contracts

```typescript
// GameSessionContext — frontend-only surface, not a backend contract
useGameSession(): {
  descriptor: MatchDescriptor | null;
  connectionStatus: "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";
  sessionState: { state: Chess960State; clock: SessionClockSnapshot; status: SessionStatus } | null;
  presence: Record<string, boolean>;
  gameResult: GameResult | null;
  moveRejection: { reason: string; id: number } | null;
  mySide: number | null;
  opponentUserId: string | null;
  startGame(descriptor: MatchDescriptor): void;
  submitMove(from: string, to: string, promotion?: string): void;
  resign(): void;
  leaveGame(): void;
}

// MatchmakingContext
useMatchmaking(): {
  phase: "idle" | "searching" | "found" | "expired" | "cancelled" | "error" | "unavailable";
  ticket: MatchTicket | null;
  descriptor: MatchDescriptor | null;
  findGame(): Promise<void>;
  cancelSearch(): Promise<void>;
  consumeMatch(): void;
  resetToIdle(): void;
}

// Services
MatchmakingService.enqueue(variantId): Promise<{ticket, matched, matchDescriptor?}>
MatchmakingService.cancel(ticketId): Promise<void>
MatchmakingService.getStatus(ticketId): Promise<{ticket, status, matchDescriptor?}>
GamesService.getHistory(): Promise<GameHistoryEntry[]>
GamesService.getLeaderboard(variantId): Promise<LeaderboardEntry[]>

// Route
GET /play/chess  (ProtectedRoute-gated)
```

### 6. Consumed By / Dependency Map

| M5 Component | Consumed By (Downstream) |
|---|---|
| **`GameSessionContext`/`MatchmakingContext`** | `PlayChessPage` and everything under `components/play/*` for multiplayer — no other part of the app reads them |
| **`types/multiplayer.ts`** | Every M5 service, context, and component — the single frontend mirror of the backend contracts |
| **AM-01 resign routing** (Backend Stabilization) | `GameActionBar`'s resign control, now actually wired end-to-end |
| **AM-02 reconnect fix** (Backend Stabilization) | `GameSessionContext`'s reconnect/backoff logic depends on presence facts actually reaching Session correctly after 30s+ |
| **AM-03 `presence_update`** (Backend Stabilization) | `ConnectionIndicator`'s opponent-presence state (`mapOpponentPresence`) |
| **AM-04 `/ws` proxy** (Backend Stabilization) | Every WebSocket connection `GameSessionContext` opens in local dev |
| **`m5_implementation_plan.md`** | The design record this section reports against — read that first for the full token inventory, component audit, state × screen matrix, and accessibility/responsive strategy |

### 7. Primary File References

| File Path | Description |
|---|---|
| [`frontend/src/types/multiplayer.ts`](file:///d:/XLchess/Chess-Project/frontend/src/types/multiplayer.ts) | Client mirror of the backend contracts + WS message shapes |
| [`frontend/src/services/matchmaking.service.ts`](file:///d:/XLchess/Chess-Project/frontend/src/services/matchmaking.service.ts) | Queue HTTP client |
| [`frontend/src/services/games.service.ts`](file:///d:/XLchess/Chess-Project/frontend/src/services/games.service.ts) | History/leaderboard HTTP client |
| [`frontend/src/context/gameSessionContext.instance.ts`](file:///d:/XLchess/Chess-Project/frontend/src/context/gameSessionContext.instance.ts) | Context object + type only (Fast Refresh split) |
| [`frontend/src/context/GameSessionContext.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/context/GameSessionContext.tsx) | WebSocket client, reconnect/backoff, sessionStorage rehydration |
| [`frontend/src/context/matchmakingContext.instance.ts`](file:///d:/XLchess/Chess-Project/frontend/src/context/matchmakingContext.instance.ts) | Context object + type only (Fast Refresh split) |
| [`frontend/src/context/MatchmakingContext.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/context/MatchmakingContext.tsx) | Queue ticket lifecycle |
| [`frontend/src/hooks/useGameSession.ts`](file:///d:/XLchess/Chess-Project/frontend/src/hooks/useGameSession.ts) | Context accessor hook |
| [`frontend/src/hooks/useMatchmaking.ts`](file:///d:/XLchess/Chess-Project/frontend/src/hooks/useMatchmaking.ts) | Context accessor hook |
| [`frontend/src/utils/chess960PositionId.ts`](file:///d:/XLchess/Chess-Project/frontend/src/utils/chess960PositionId.ts) | Display-only ported Scharnagl FEN generator (verified byte-identical to backend) |
| [`frontend/src/components/play/SideClock.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/SideClock.tsx) | The signature "Flagfall" clock |
| [`frontend/src/components/play/PlayerPanel.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/PlayerPanel.tsx) | Identity + presence + clock, merged row |
| [`frontend/src/components/play/OpponentIdentity.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/OpponentIdentity.tsx) | Deterministic pseudonymous crest |
| [`frontend/src/components/play/ConnectionIndicator.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/ConnectionIndicator.tsx) | Glyph + word presence indicator |
| [`frontend/src/components/play/MultiplayerBoard.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/MultiplayerBoard.tsx) | Server-authoritative board, optimistic-move overlay |
| [`frontend/src/components/play/GameActionBar.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/GameActionBar.tsx) | Two-step resign; draw disabled-with-reason |
| [`frontend/src/components/play/LiveRegion.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/LiveRegion.tsx) | `aria-live` announcer |
| [`frontend/src/components/play/QueuePanel.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/QueuePanel.tsx) | Queue idle/searching/expired/error/unavailable states |
| [`frontend/src/components/play/MatchFoundCard.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/MatchFoundCard.tsx) | Match-found handoff, real starting position |
| [`frontend/src/components/play/LobbyView.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/LobbyView.tsx) | Composes queue + history + leaderboard |
| [`frontend/src/components/play/ResultRevealModal.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/ResultRevealModal.tsx) | Result reveal grown from the board |
| [`frontend/src/components/play/GameHistoryList.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/GameHistoryList.tsx) | Consumes `GET /api/games/history/me` |
| [`frontend/src/components/play/LeaderboardPanel.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/LeaderboardPanel.tsx) | Consumes `GET /api/games/leaderboard/:variantId` |
| [`frontend/src/components/play/PlayChessGame.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/PlayChessGame.tsx) | Live-game assembly |
| [`frontend/src/pages/PlayChessPage.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/pages/PlayChessPage.tsx) | Lobby → match-found → game state-machine shell |
| [`frontend/src/router/routes.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/router/routes.tsx) | Extended: `/play/chess` route |
| [`frontend/src/main.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/main.tsx) | Extended: `MatchmakingProvider`/`GameSessionProvider` nesting |
| [`frontend/src/components/SidebarLayout.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/SidebarLayout.tsx) | Extended: "Play Online" nav entry |
| [`frontend/src/index.css`](file:///d:/XLchess/Chess-Project/frontend/src/index.css) | Extended: `--dur-*` tokens, `.clock-flag-sweep`/`.clock-plate--flagged`/`.reveal-in` |
| [`m5_implementation_plan.md`](file:///d:/XLchess/Chess-Project/m5_implementation_plan.md) | The full design plan (tokens, component audit, state × screen matrix, a11y/responsive strategy) this section reports against |

### 8. Upcoming Milestone Handoff / Follow-up Work (M6)

- **Live two-client verification is the first thing to do with real credentials**: queue → match → play (including a reconnect mid-game) → result → history, on two real signed-in accounts.
- **Not addressed, still open, unchanged from the Backend Stabilization section above**: draw offers (**B2**), rated matchmaking (**B6**), opponent display name/avatar (**B8**), premove (**B10**) — all four are backend/feature work, not frontend gaps.
- **Simplifications made deliberately in this pass** (documented so they're not mistaken for oversights): no landscape-specific breakpoint (portrait/desktop stacking covers narrow viewports); the move log does not collapse into a mobile bottom sheet (it scrolls inline at all widths); no spoken 30s/10s countdown announcements beyond the turn/check/result ones already implemented; the "opponent never connected" banner is a client-side soft timeout (65s) rather than a hard signal, because `SessionManager.handleWaitTimeout()` sends no message to the client on that path at all.
- **`Course`/`Lesson`/`LessonProgress`/`CustomLink` migrations and the `Opening` schema drift** (flagged since M4 §1.6) remain untouched and unrelated to M5.

---

## Post-M5 Live-Play Stabilization

- **Status**: Completed & Verified
- **Primary Goal**: Close five bugs and glitches found live-testing M5 with two real signed-in accounts — a matchmaking-timer desync/overrun, an opponent-presence gap, and three live-game display bugs (missing identity, a clock that visibly rewinds after the first move, and a "match syncing" countdown that replays over an already-in-progress game on refresh). Continues the AM- numbering from the Backend Stabilization (Pre-M5) section above, since these are the same kind of amendment: verified defects in already-frozen code, not new design.

### 1. Summary of Implementation

1. **AM-06 — Matchmaking Ticket Lazy Expiry (`backend/src/matchmaking/MatchmakingQueue.ts`)**:
   - **Problem**: `getTicket(ticketId)` — read by both `GET /api/matchmaking/queue/:ticketId` and `enqueue()`'s idempotency check — returned the raw ticket from the map with no expiry check. The only place that ever flipped a stale `WAITING` ticket to `EXPIRED` was `ExpiryTicker`'s 30s periodic sweep, so a client polling right after its own countdown hit `0:00` could still be told `WAITING` for up to ~30s longer: the search UI kept "scanning" well past the advertised 60s TTL.
   - **Fix**: extracted the mark/emit/delete logic `expireStale()` already had into a shared private `expireTicket(ticket)`, and `getTicket()` now calls it lazily — if a `WAITING` ticket is read past its `expiresAt`, it's expired on the spot before being returned. `enqueue()`'s idempotency lookup now routes through `getTicket()` too, so re-enqueuing never silently reattaches to an already-stale ticket. `expireStale()`'s periodic sweep is unchanged and still covers tickets nobody is actively polling (e.g. a closed tab).
   - **Scope discipline**: `ExpiryTicker`, `MATCHED_RETENTION_MS`/`pruneMatched()`, and the ticket TTL value itself are untouched — this only changes *when* expiry is detected, not the deadline itself.

2. **AM-07 — Presence Bootstrap for the Second-Connecting Participant (`backend/src/session/SessionManager.ts`)**:
   - **Problem (verified defect)**: AM-03's `broadcastPresence()` fires at the instant a participant's socket registers, via `SessionTransport.send()` → `ConnectionManager.send()`, which silently no-ops for any recipient not yet registered (`if (!connId) return`). Since presence is only ever broadcast *at the moment of connection*, whichever participant connects **second** never receives the **first** participant's "connected" fact — there's no catch-up snapshot, and no further connect event ever fires for the first participant to correct it. That participant's opponent-presence indicator stayed "Unknown" for the rest of the game, every game, for whichever side happened to connect second.
   - **Fix**: `notifyParticipantConnected()` now, before adding the new participant to `presence` and broadcasting their own fact, directly `send()`s the just-connected participant a `presence_update` for every *other* participant already in the `presence` Set. Same message shape AM-03 already defined (`{userId, connected: true}`), sent once per already-present peer, directly to the newcomer only (not a broadcast). Both directions are now covered regardless of connection order.
   - **Scope discipline**: no new message type, no `SessionTransport` interface change, no new state — reads the same `presence` Set `notifyParticipantConnected`/`broadcastPresence` already own.

3. **AM-08 — Queue Timer Rounding & Waiting Feedback (frontend)**:
   - **Problem**: `QueuePanel.tsx`'s single `formatCountdown()` applied `Math.ceil()` to both the count-up "Searching" timer and the count-down "Expires in" timer. Since the two always sum to exactly 60s as real numbers, `ceil(x) + ceil(60-x)` overshoots to 61 whenever `x` isn't an exact integer second (true almost always) — e.g. "0:01" next to "1:00" on the very first tick. Separately, `PlayChessGame.tsx` had no feedback at all for the normal 0–65s `WAITING` window (only a 65s+ "taking longer than expected" warning), so a player who'd already connected had no indication the game was waiting on their opponent.
   - **Fix**: `QueuePanel.tsx` now has `formatElapsed()` (`Math.floor`) and `formatRemaining()` (`Math.ceil`) built on a shared `formatMinSec()` — algebraically `floor(x) + ceil(60-x) = 60` for all `x`, so the pair never drifts. `PlayChessGame.tsx` gained a "Waiting for your opponent to connect…" banner shown whenever `status === "WAITING"` and the existing 65s+ banner hasn't fired yet.
   - **Scope discipline**: no backend change; purely display-layer fixes in the two components that already owned this UI.

4. **AM-09 — Participant Display Identity: Real Name & Avatar (closes B8)**:
   - **Problem**: `m5_implementation_plan.md` §0 **B8** ("opponent display name/avatar") was deliberately deferred at M5 time because no public user-lookup endpoint existed, so `OpponentIdentity.tsx` rendered a hashed-crest pseudonym and a static "Opponent"/"You" label for every participant — a real product decision to revisit, explicitly flagged as still-open in both the Backend Stabilization and M5 sections above.
   - **Fix**: rather than adding a new lookup endpoint, the participant's `name`/`image` — already known to the server at enqueue time via the same Auth.js session `requireAuth` already populates (`req.user.name`/`req.user.image`) — are carried through the existing hand-off path: `ParticipantAssignment` (`backend/src/contracts/matchDescriptor.ts`) gains optional `name?`/`image?`; `MatchTicket` (`backend/src/matchmaking/types.ts`) gains the same, captured once in `enqueue()` and copied into `MatchDescriptor.participants` by `tryPair()` (and preserved through `compensateFailedMatch()`'s ticket rebuild). `matchmaking.controller.ts`'s `enqueueTicket` reads `req.user?.name`/`req.user?.image` and passes them through. On the frontend, `OpponentIdentity.tsx` renders the real avatar (`referrerPolicy="no-referrer"` so Google's CDN doesn't block the hotlink, `onError` falling back to the original hashed crest) and real name, falling back to the pseudonym only for a participant with neither set. `PlayerPanel.tsx`, `PlayChessGame.tsx`, and `MatchFoundCard.tsx` thread the values through from `descriptor.participants` (opponent) and the live session (`session.user`, own).
   - **Both `ParticipantAssignment` fields are additive-only** — every existing required field is untouched, and both are optional, so no existing consumer (Results, Session, any M0–M4 test constructing a bare descriptor) needs to change.
   - **Scope discipline**: no new HTTP endpoint was added — B8 is closed via the hand-off path Matchmaking already owns, not a new user-lookup surface. `VariantContract` and `GameResult` are untouched.

5. **AM-10 — Live-Game Clock & Sync-Countdown Correctness (frontend)**:
   - **Problem A (clock rewind)**: a "3…2…1…PLAY!" match-sync overlay (added during M5 polish, after the Backend Stabilization pass) set a local `gameStartTime` once it finished, and `SideClock.tsx` used `lastMoveAt ?? gameStartTime` as its ticking anchor. `SessionManager.submitMove()` never charges any time for the pre-first-move `READY` window by design (`lastMoveAt` stays `null` until the first move lands, and that first move deducts nothing). So the mover's clock visibly ticked down locally as soon as the overlay finished, then snapped back up to the server's true (unchanged) `remainingMs` the instant the first move's real `state_update` arrived — a visible rewind.
   - **Problem B (countdown replay on refresh)**: the same overlay was gated on a local `moveLog.length === 0` check. `moveLog` is component-local state that always starts empty on mount, so a page refresh mid-game (a real game already in `PLAYING`, moves already made) remounted with `moveLog.length === 0` and replayed the fake "Match Syncing" countdown over an already-live game, freezing `interactive` (and blocking real moves) for ~3 seconds after every refresh.
   - **Fix**: `SideClock.tsx` now ticks only from `lastMoveAt` (the server's own anchor) — the `gameStartTime` prop is removed entirely from `SideClock`/`PlayerPanel`/`PlayChessGame`. The countdown in `PlayChessGame.tsx` is now gated on server `status === "READY"` (the genuine pre-first-move window) instead of `moveLog.length`, so a fresh match still gets the 3-2-1 animation exactly once, and a mid-game refresh — which mounts directly into `status === "PLAYING"` — never sees it.
   - **Scope discipline**: no backend change; `SessionManager`'s clock-authority behavior (no time charged before the first move) was the correctness reference, not something to change.

### 2. Acceptance Criteria

1. **AM-06**: `GET /api/matchmaking/queue/:ticketId` and `enqueue()`'s idempotency path never report a `WAITING` ticket past its own `expiresAt`, independent of `ExpiryTicker`'s 30s cadence.
2. **AM-07**: both participants' opponent-presence indicator reaches "Live" regardless of which of the two connects first — verified by tracing both connection orderings against `notifyParticipantConnected()`.
3. **AM-08**: `QueuePanel`'s "Searching"/"Expires in" pair always sums to exactly 60 at any instant; a `WAITING` game shows an immediate banner, not just the 65s+ warning.
4. **AM-09**: a real, matched game shows each participant's actual name and avatar (with graceful fallback to the pre-existing pseudonym for a participant with neither set); `ParticipantAssignment`'s two new fields are optional and don't affect any existing construction site.
5. **AM-10**: a side's clock never visibly counts down before that side's `lastMoveAt` is real (i.e. never before their own first move lands); the 3-2-1 sync overlay never appears on a page refresh mid-`PLAYING` game.
6. **Zero regression**: all 53 pre-existing backend tests pass unmodified; `npm run build`/`tsc --noEmit` clean on both `backend/` and `frontend/`.

### 3. Key Architectural & Implementation Decisions

- **All five are amendments, not redesigns** — same standard as AM-01–AM-05: each closes one verified gap, preserves all existing behavior otherwise, and is documented here per this document's own standards.
- **AM-09 deliberately reuses the existing hand-off path instead of adding a lookup endpoint** — `MatchDescriptor` was already the one-way, immutable value carrying everything a match's downstream consumers need; adding two optional display fields to it is a smaller, more consistent surface than a new authenticated `GET /api/users/:id` endpoint would have been, and avoids exposing user lookup beyond "the person you're currently matched with."
- **AM-10 removes code rather than patching it** — once `SideClock` no longer needs a client-fabricated anchor, `gameStartTime` had no remaining purpose anywhere in the component tree and was deleted rather than left as dead state, per this codebase's stated preference for deleting confirmed-unused code over leaving compatibility shims.

### 4. Regression Guard

- **`MatchmakingQueue.getTicket()`'s lazy-expiry behavior is now load-bearing** — any future read path added to `MatchmakingQueue` that needs a live ticket should call `getTicket()`, not read the `tickets` map directly, or it reopens AM-06.
- **Presence bootstrap in `notifyParticipantConnected()` must stay a direct `send()` to the newcomer, not folded into `broadcastPresence()`'s broadcast** — the two serve different recipients (existing participants vs. the one just connecting) and merging them would silently drop one side again.
- **`ParticipantAssignment.name`/`.image` are optional and must stay that way** — no consumer may assume they're present; `OpponentIdentity.tsx`'s pseudonym fallback is the permanent behavior for a participant with neither set, not a temporary state.
- **`SideClock` must never accept a client-only time anchor again** — its only valid ticking anchor is `lastMoveAt`, which mirrors `SessionManager`'s own clock authority exactly. Any future "feels alive" polish (e.g. a pre-move animation) must not feed `SideClock` a timestamp the server isn't also using to compute `remainingMs`.
- **The sync countdown must stay gated on server `status`, never on local move/render state** — anything client-only (a counter, a mount flag) breaks on refresh/reconnect, which is exactly what AM-10 fixed.

### 5. Public APIs & Frozen Contracts

```typescript
// AM-09 — ParticipantAssignment: additive-only (backend/src/contracts/matchDescriptor.ts)
interface ParticipantAssignment {
  readonly userId: string;
  readonly side: number;
  readonly name?: string;   // new
  readonly image?: string;  // new
}

// AM-09 — MatchmakingQueue.enqueue: two new optional trailing params
matchmakingQueue.enqueue(userId, variantId, name?, image?)

// AM-07 — no interface change; SessionTransport.send() (already existed) is now also called
// from notifyParticipantConnected() to bootstrap a newcomer's view of existing presence.
```

### 6. Consumed By / Dependency Map

| Component | Consumed By (Downstream) |
|---|---|
| **AM-06 lazy `getTicket()` expiry** | `matchmaking.controller.ts`'s `getTicketStatus`/`enqueue` — every matchmaking HTTP read |
| **AM-07 presence bootstrap** | `PlayChessGame.tsx`'s opponent `ConnectionIndicator` |
| **AM-08 timer/banner fixes** | `QueuePanel.tsx`, `PlayChessGame.tsx` |
| **AM-09 `name`/`image`** | `OpponentIdentity.tsx`, `PlayerPanel.tsx`, `PlayChessGame.tsx`, `MatchFoundCard.tsx` |
| **AM-10 `SideClock`/countdown fixes** | `PlayerPanel.tsx`, `PlayChessGame.tsx` |

### 7. Primary File References

| File Path | Description |
|---|---|
| [`backend/src/matchmaking/MatchmakingQueue.ts`](file:///d:/XLchess/Chess-Project/backend/src/matchmaking/MatchmakingQueue.ts) | AM-06: shared `expireTicket()`, lazy expiry in `getTicket()`; AM-09: `enqueue()`/`tryPair()`/`compensateFailedMatch()` carry `name`/`image` |
| [`backend/src/matchmaking/types.ts`](file:///d:/XLchess/Chess-Project/backend/src/matchmaking/types.ts) | AM-09: `MatchTicket.name`/`.image` |
| [`backend/src/matchmaking/matchmaking.controller.ts`](file:///d:/XLchess/Chess-Project/backend/src/matchmaking/matchmaking.controller.ts) | AM-09: `enqueueTicket` reads `req.user?.name`/`.image` |
| [`backend/src/contracts/matchDescriptor.ts`](file:///d:/XLchess/Chess-Project/backend/src/contracts/matchDescriptor.ts) | AM-09: `ParticipantAssignment.name`/`.image` (additive) |
| [`backend/src/session/SessionManager.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/SessionManager.ts) | AM-07: presence bootstrap in `notifyParticipantConnected()` |
| [`frontend/src/types/multiplayer.ts`](file:///d:/XLchess/Chess-Project/frontend/src/types/multiplayer.ts) | AM-09: mirrors `name`/`.image` on `ParticipantAssignment`/`MatchTicket` |
| [`frontend/src/components/play/QueuePanel.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/QueuePanel.tsx) | AM-08: `formatElapsed`/`formatRemaining` |
| [`frontend/src/components/play/PlayChessGame.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/PlayChessGame.tsx) | AM-08: waiting banner; AM-09: opponent/own identity wiring; AM-10: status-gated countdown, `gameStartTime` removed |
| [`frontend/src/components/play/OpponentIdentity.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/OpponentIdentity.tsx) | AM-09: real avatar/name rendering with pseudonym fallback |
| [`frontend/src/components/play/PlayerPanel.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/PlayerPanel.tsx) | AM-09: threads `name`/`image`; AM-10: `gameStartTime` prop removed |
| [`frontend/src/components/play/SideClock.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/SideClock.tsx) | AM-10: ticks from `lastMoveAt` only |
| [`frontend/src/components/play/MatchFoundCard.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/MatchFoundCard.tsx) | AM-09: real opponent/own identity on the handoff card |

### 8. Upcoming Milestone Handoff / Follow-up Work (M6)

- **B8 is now closed** — remove it from the "not addressed" lists in the Backend Stabilization and M5 sections above the next time either is touched for an unrelated reason (not rewritten now, per this document's "never rewrite previous milestone history" rule).
- **Still open, unchanged**: draw offers (**B2**), rated matchmaking (**B6**), premove (**B10**).
- **Live two-client verification with real credentials remains the first thing to do** — this pass was verified by code tracing, type-checking, and the full backend test suite, not a live two-browser session.

---

## Milestone M6 — Hardening & Rollout Expansion

- **Status**: In Progress
- **Primary Goal**: Close verified defects found in live two-client play — a reconnect indicator that never clears, a state-resync gap for a participant reconnecting mid-game, and a clock-fairness bug that let a player bank unlimited free thinking time before their first move. Continues the AM- numbering from the Backend Stabilization and Post-M5 sections above, since these are the same kind of amendment: verified defects in already-frozen code, not new design.

### 1. Summary of Implementation

1. **AM-11 — Reconnect Confirmation Never Sent (`backend/src/transport/TransportServer.ts`)**:
   - **Problem (verified defect)**: `GameSessionContext.tsx`'s `connectionStatus` only ever transitions out of `"reconnecting"` when it receives a WS message of `type: "connected"` (`handleMessage()`'s `case "connected"` is the only branch that calls `setConnectionStatus("connected")` and resets the backoff counter). The fresh-connection handshake branch in `TransportServer.ts` sends exactly that message after `connectionManager.register()`. The reconnect-handshake branch, however, called `connectionManager.markReconnected()` and — on success — sent nothing back at all; it only forwarded whatever the `ReconnectBuffer` had queued. A reconnect could succeed completely at the transport level (new socket registered, presence/state flowing again) while the client's own UI stayed on "RECONNECTING" forever, since the one message type that clears it was never sent on this path.
   - **Fix**: on a successful `markReconnected()`, the reconnect branch now sends the same `{type: "connected", payload: {connectionId, resumeToken}}` shape the fresh-handshake branch already sends, routed through `connectionManager.send()` (not a raw `ws.send()`) so it gets a proper monotonic `seq` stamp and buffering like every other outbound message on the logical connection, instead of an out-of-band unstamped message that could confuse `lastReceivedSeq` bookkeeping on the next reconnect.
   - **Scope discipline**: no new message type, no `OutboundMessage`/`InboundMessage` contract change — reuses the exact `"connected"` shape the client already handles.

2. **AM-12 — Reconnect Mid-`PLAYING` Resync Gap (`backend/src/session/SessionManager.ts`)**:
   - **Problem (verified defect)**: `ConnectionManager.send()` no-ops for any user not currently in `userIndex` (`if (!connId) return`), and `disconnect()` removes the user from `userIndex` immediately. Combined, this means `ReconnectBuffer.push()` — only ever called from inside `send()` — never buffers anything addressed to a participant while they're offline; there is nothing for `markReconnected()`'s replay to replay. `notifyParticipantConnected()`'s `PLAYING` branch (a single participant reconnecting while the other stayed connected) only cleared that participant's grace timer and returned — it never sent them a fresh snapshot. Net effect: a participant reconnecting mid-game whose opponent had moved during the gap would never learn about that move; their board could sit permanently stale relative to the live game.
   - **Fix**: the `PLAYING` branch of `notifyParticipantConnected()` now also directly `send()`s the reconnecting participant a `state_update` with the session's current `currentState`/`clock`/`status` — a direct send to just that user, not a broadcast (the opponent already has the latest state). Same payload shape `broadcastState()` already sends on every move; no new message type.
   - **Scope discipline**: `ReconnectBuffer`, `ConnectionManager`'s send/disconnect semantics, and the `PAUSED` resume path (already broadcasts full state on resume) are all untouched — this closes the one gap where reconnect happened without any full-state handoff.

3. **AM-13 — Clock Starts at Game-Ready, Not First Move (`backend/src/session/SessionManager.ts`, `types.ts`)**:
   - **Problem (verified defect, previously documented as intentional design)**: M1's acceptance criteria and the Post-M5 AM-10 entry both explicitly recorded "clocks start strictly on first move" as correct, frozen behavior — `notifyAllPresent()` (`WAITING → READY`) left `clock.lastMoveAt` at `null`, and `tickClocks()` skipped `READY` entirely. In practice this let the side to move first bank unlimited free thinking time before ever moving (e.g. sit idle for the opponent's entire 5-minute budget and still show `5:00` on their first move) at the opponent's direct expense — not how any standard chess clock behaves, and reported as unfair.
   - **Also found while fixing the above**: `submitMove()` deducted `now - lastMoveAt` from the mover's remaining time on every move, but `tickClocks()` (driven by `ClockTicker` every 100ms with real wall-clock elapsed) was *already* continuously decrementing that same side's `remainingMs` for the same span, silently, without ever broadcasting the intermediate value. The two mechanisms independently charged the same elapsed time, so every move past the first double-charged the mover — the clock a client actually saw update after a move reflected roughly 2x the real time spent, minus increment.
   - **Fix**: `notifyAllPresent()` now sets `clock.lastMoveAt = Date.now()` when transitioning to `READY`, and `tickClocks()`'s guard now includes `READY` alongside `PLAYING` — the side to move first is charged from the moment both participants are present, exactly like a physical chess clock started at the board. `submitMove()` no longer independently deducts `now - lastMoveAt`; `tickClocks()` is now the single source of truth for decrementing a running clock, and `submitMove()` only credits the increment and resets the `lastMoveAt` anchor both `tickClocks()` and the frontend's `SideClock` use going forward. A timeout can now also fire during `READY` (a player who never makes a single move before their clock runs out) — `tickClocks()`'s timeout branch now logs the actual prior status (`READY` or `PLAYING`) instead of a hardcoded `"PLAYING"`.
   - **Frontend**: no logic change was needed — `SideClock.tsx` already ticks from `lastMoveAt` whenever it's non-null, and `PlayChessGame.tsx`'s `isGameActive`/`isLive` already treat `READY` as a live state (it already runs the "3…2…1…PLAY!" sync countdown during `READY`). Setting `lastMoveAt` earlier on the backend was sufficient to make the display tick from game start; only a stale comment in `SideClock.tsx` (claiming `lastMoveAt` stays `null` until the first move) was updated to match.
   - **Scope discipline**: this supersedes M1's "clocks start strictly on first move" acceptance criterion and AM-10's characterization of that behavior as the correctness reference — both are amended by this entry, not silently reinterpreted. `SessionClock`'s shape, the `GameResult` contract, and `ClockTicker`'s own code are untouched.

### 2. Acceptance Criteria

1. **AM-11**: a client whose WebSocket drops and successfully reconnects (valid, unexpired `resumeToken`) always receives a `"connected"` message on the new socket and its `connectionStatus` returns to `"connected"`, matching the fresh-connection handshake.
2. **AM-12**: a participant who disconnects and reconnects mid-`PLAYING` always receives a `state_update` reflecting the session's current state, regardless of whether their opponent moved during the gap.
3. **AM-13**: the side to move first has their `remainingMs` decrementing from the instant both participants are present (`READY`), not from their first move; a full game's total time charged to a side matches real elapsed wall-clock time for that side's turns (not ~2x); a player who never moves and lets their clock expire during `READY` ends the game with a `timeout` `GameResult` exactly like a `PLAYING` timeout does.
4. **Zero regression**: all 55 pre-existing + newly added backend tests pass; `npm run build` (backend) and `tsc --noEmit` (frontend) are both clean.

### 3. Key Architectural & Implementation Decisions

- **All three are amendments, not redesigns** — same standard as AM-01–AM-10: each closes one verified gap, preserves all existing behavior otherwise, and is documented here per this document's own standards.
- **AM-13 deliberately overturns a previously-documented "correct" behavior** — M1's acceptance criteria and AM-10 both called the old first-move-only charging intentional. This is recorded explicitly (not silently reinterpreted) because a future reader tracing clock behavior through this document should find the amendment, not conclude the current code contradicts frozen milestone history.
- **`tickClocks()` becomes the single decrementing authority** rather than fixing the double-charge by instead removing `tickClocks()`'s own mutation — `submitMove()`'s elapsed-based deduction was the redundant one, since `tickClocks()` already runs continuously and is what a timeout-without-a-move now also depends on for `READY`.
- **AM-12's fix is a direct `send()`, not a change to `ReconnectBuffer` or `ConnectionManager`** — Session already owns "what does this participant need to see right now" for the `PAUSED` resume case; extending that same authority to the `PLAYING` single-side-reconnect case is more consistent than teaching Transport to buffer for offline users (a larger, riskier change to already-tested M1 transport code).

### 4. Regression Guard

- **`submitMove()` must not reintroduce an elapsed-time deduction** — `tickClocks()` is now the sole mechanism that decrements a running clock; re-adding a `now - lastMoveAt` subtraction in `submitMove()` reopens the AM-13 double-charge.
- **`notifyAllPresent()` must keep setting `clock.lastMoveAt` on the `WAITING → READY` transition** — removing it regresses to the pre-AM-13 free-time bug the user explicitly reported.
- **`tickClocks()`'s `READY` guard must stay alongside `PLAYING`** — removing `READY` from the guard silently reintroduces the same bug even if `lastMoveAt` is still set at `READY`, since nothing would then be decrementing `remainingMs` before the first move.
- **The AM-11 reconnect confirmation must go through `connectionManager.send()`, not a raw `ws.send()`** — routing around `send()` would skip the `seq` stamp and `ReconnectBuffer` bookkeeping every other outbound message on the connection relies on.
- **AM-12's resync `send()` must stay a direct `send()` to the reconnecting `userId` only** — broadcasting it would re-send the opponent their own already-current state on every reconnect, which is harmless but pointless traffic; keep the asymmetry intentional.

### 5. Public APIs & Frozen Contracts

```typescript
// AM-13 — SessionClock: no shape change, only when lastMoveAt first becomes non-null
// (backend/src/session/types.ts)
interface SessionClock {
  readonly remainingMs: readonly number[];
  readonly lastMoveAt: number | null; // now set at READY, not at the first move
}

// AM-11 / AM-12 — no interface change; both reuse the existing SessionTransport.send()
// and the existing "connected" / "state_update" OutboundMessage shapes.
```

### 6. Consumed By / Dependency Map

| Component | Consumed By (Downstream) |
|---|---|
| **AM-11 reconnect confirmation** | `GameSessionContext.tsx`'s `connectionStatus` state machine |
| **AM-12 mid-`PLAYING` resync** | Any reconnecting participant's board/clock via `sessionState` |
| **AM-13 clock-start-at-READY** | `SideClock.tsx`, `PlayChessGame.tsx`'s `isLive`/clock derivation (no code change needed there) |

### 7. Primary File References

| File Path | Description |
|---|---|
| [`backend/src/transport/TransportServer.ts`](file:///d:/XLchess/Chess-Project/backend/src/transport/TransportServer.ts) | AM-11: sends `"connected"` confirmation on successful reconnect |
| [`backend/src/session/SessionManager.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/SessionManager.ts) | AM-12: `PLAYING`-branch resync send in `notifyParticipantConnected()`; AM-13: `notifyAllPresent()` starts the clock, `submitMove()` no longer double-deducts, `tickClocks()` runs during `READY` and logs the real prior status on timeout |
| [`backend/src/session/types.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/types.ts) | AM-13: `SessionClock` doc comment updated |
| [`frontend/src/components/play/SideClock.tsx`](file:///d:/XLchess/Chess-Project/frontend/src/components/play/SideClock.tsx) | AM-13: stale comment updated (no logic change — already ticks from `lastMoveAt`) |
| [`backend/src/session/__tests__/SessionManager.test.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/__tests__/SessionManager.test.ts) | AM-13: updated clock-start/tick tests, new READY-timeout test |
| [`backend/src/session/__tests__/SessionManager.presence.test.ts`](file:///d:/XLchess/Chess-Project/backend/src/session/__tests__/SessionManager.presence.test.ts) | AM-12: new mid-`PLAYING` resync test; recording transport double extended to record `send()` calls |

### 8. Upcoming Milestone Handoff / Follow-up Work

- **Live two-client verification with real credentials is still the first thing to do for M6** — this pass (AM-11/12/13) was verified by code tracing, the full backend test suite, and type-checking on both packages, not a live two-browser session with an actual network interruption.
- **Still open, unchanged from prior sections**: draw offers (**B2**), rated matchmaking (**B6**), premove (**B10**).
