/**
 * Variant Contract — Frozen Contract
 *
 * The rules-only interface that Session delegates to. Session is rules-blind —
 * it never contains chess logic. A Variant implementation answers rules questions
 * and nothing else.
 *
 * CANONICAL REFERENCE: Phase 3.2 §2
 *
 * SESSION ↔ VARIANT RELATIONSHIP
 *   Session orchestrates; Variant adjudicates.
 *   Session asks: "Is this move legal in this position?"
 *   Variant answers: yes/no, and provides the resulting state.
 *   Session never second-guesses the answer.
 *   Variant never knows it is inside a Session.
 *
 * PURITY (Invariant 7)
 *   All VariantContract methods are pure functions.
 *   No I/O, no side effects, no network calls, no database access, no timers.
 *   A Variant receives state and returns state — nothing else.
 *
 * SOLE AUTHORITY (Invariant 2)
 *   Variant is the sole authority on rules. No other domain may contain move
 *   validation, game state interpretation, or terminal detection.
 *
 * EXTENSION RULE (Invariant 8)
 *   No switch(variantId) may appear in Session, Transport, Matchmaking, or Results.
 *   A new variant is added by implementing this interface — zero foundation changes.
 *
 * EXCLUDED (intentionally)
 *   Clocks / time        → Session's domain
 *   Player identity      → Session maps participants to sides
 *   Connections          → Transport's domain
 *   Persistence          → Session decides when; service layer writes
 *   Game lifecycle       → Session owns the state machine
 *   Ratings              → Results' domain
 */

// ─────────────────────────────────────────────────────────────────────────────
// Supporting types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Variant's declaration of participant structure and turn order.
 * Returned once per game by getCardinality().
 */
export interface VariantCardinality {
  /** Number of competing sides. */
  readonly sides: number;
  /** Number of participants per side. */
  readonly perSide: number;
  /**
   * Zero-indexed side numbers in their turn order.
   * Length must equal sides. Standard chess: [0, 1].
   */
  readonly turnOrder: readonly number[];
}

/** How a terminal game ended. */
export type TerminalOutcome =
  | {
      readonly kind: "win";
      /** Zero-indexed side number of the winner. */
      readonly winningSide: number;
      /** Human-readable reason, e.g. "checkmate", "timeout", "resignation". */
      readonly reason: string;
    }
  | {
      readonly kind: "draw";
      /** Human-readable reason, e.g. "stalemate", "fifty-move rule", "agreement". */
      readonly reason: string;
    };

/** Result of validating a proposed move. */
export type MoveValidationResult =
  | { readonly legal: true }
  | { readonly legal: false; readonly reason: string };

/**
 * The canonical board position — opaque to all domains except Variant.
 *
 * Session stores this, passes it to Variant methods, and checkpoints it.
 * Session never inspects or modifies the contents.
 * Only the Variant that produced it may interpret it.
 */
export type GameState = Readonly<Record<string, unknown>>;

/**
 * A move in whatever format the Variant understands.
 *
 * Submitted by the client → validated by Session → forwarded to Variant.
 * Opaque to all domains except the Variant it is destined for.
 */
export type Move = Readonly<Record<string, unknown>>;

// ─────────────────────────────────────────────────────────────────────────────
// Primary contract
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The Variant Contract interface.
 *
 * Every variant implementation must satisfy this interface exactly.
 * Session calls these methods; no other domain may call them directly.
 *
 * All methods are synchronous and pure. If a variant requires async computation
 * (e.g. engine evaluation), that must be resolved before the result enters these methods.
 */
export interface VariantContract {
  /**
   * The identifier this Variant responds to.
   * Must match the variantId field in the Match Descriptor that triggers its use.
   * Examples: "chess960", "standard".
   */
  readonly variantId: string;

  /**
   * Declares the participant structure for this variant, given the variant parameters
   * from the Match Descriptor.
   *
   * Called once during Session initialisation, before initialState().
   */
  getCardinality(params: Readonly<Record<string, unknown>>): VariantCardinality;

  /**
   * Produces the initial game state from variant parameters.
   *
   * Called once during Session initialisation.
   * For Chess960: generates the randomised starting position from the position ID
   * (or generates a new random one if absent) and returns the full FEN-equivalent state.
   */
  initialState(params: Readonly<Record<string, unknown>>): GameState;

  /**
   * Determines whether a proposed move is legal in the current game state.
   *
   * Session MUST call this before applyMove. Session never applies a move
   * without a { legal: true } response from this method.
   *
   * @param state     Current authoritative game state.
   * @param move      Proposed move from a participant.
   * @param sideIndex Zero-indexed side number of the participant submitting the move.
   */
  validateMove(
    state: GameState,
    move: Move,
    sideIndex: number,
  ): MoveValidationResult;

  /**
   * Applies a validated legal move and returns the next game state.
   *
   * Session MUST only call this after validateMove returns { legal: true }.
   * The input state is not mutated; a new state is returned.
   */
  applyMove(state: GameState, move: Move): GameState;

  /**
   * Determines whether the given state is terminal (the game is over).
   *
   * Called by Session after every move. If true, Session calls getOutcome()
   * and transitions to COMPLETED.
   */
  isTerminal(state: GameState): boolean;

  /**
   * Returns the outcome of a terminal state.
   *
   * Session MUST only call this when isTerminal() returns true.
   */
  getOutcome(state: GameState): TerminalOutcome;

  /**
   * Returns all legal moves available for the given side in the current state.
   *
   * Used by Session for:
   *   - Confirming move legality in O(1) lookups when the full set is small.
   *   - Hint support (future feature).
   *   - Stalemate / no-legal-moves detection.
   */
  legalMoves(state: GameState, sideIndex: number): Move[];
}
