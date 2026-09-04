/**
 * Server-side Stockfish adapter (UCI over the `stockfish` WASM build).
 *
 * Analysis must run server-side — the frontend engine in `useStockfish.ts` is
 * client-controlled and worthless as evidence.
 *
 * Requests are serialised through a queue because a UCI engine holds one
 * position at a time; two concurrent `go` commands would interleave and return
 * each other's scores.
 */

import { createRequire } from "module";
import path from "path";
import { reportError } from "../../../realtime/observability/index.js";

const require = createRequire(import.meta.url);

/** Engine build. "lite-single" avoids threads, which Node's WASM host doesn't provide. */
const ENGINE_BIN = "stockfish-18-lite-single.js";

/** Recorded alongside cached analysis, so evaluations from different builds are never compared. */
export const ENGINE_NAME = "stockfish-18-lite-single";

/** Evaluation of one position, always from the moving side's point of view. */
export interface PositionEval {
  /** Centipawns. Positive favours the side to move. */
  readonly scoreCp: number;
  /** Set when the position is a forced mate; positive = mate for the side to move. */
  readonly mateIn?: number;
  /** Engine's preferred move, UCI ("e2e4", "e7e8q"). */
  readonly bestMove?: string;
  /** The full principal variation (best line found) in UCI moves, from the latest `info` line. Longer than mateIn*2-1 plies if the engine's line continues past the mate it announces. */
  readonly pv?: string[];
  readonly depth: number;
}

interface QueuedRequest {
  readonly fen: string;
  readonly depth: number;
  readonly chess960: boolean;
  readonly resolve: (value: PositionEval) => void;
  readonly reject: (err: Error) => void;
}

/** Mate scores are clamped to this so a forced mate can't dominate a centipawn average. */
const MATE_SCORE_CP = 10_000;

interface EngineModule {
  ccall: (...args: unknown[]) => unknown;
  /**
   * The engine's own `print`/`printErr` delegate to this when set, so `listener`
   * is the correct output hook. Overriding `print` does nothing — it is defined
   * by the WASM module itself and only consults `listener`.
   */
  listener?: (line: string) => void;
}

export class StockfishEngine {
  private engine: EngineModule | null = null;
  private ready: Promise<void> | null = null;
  private readonly queue: QueuedRequest[] = [];
  private processing = false;
  private chess960Enabled = false;
  /** Set for the duration of one `go`. UCI output outside a request is discarded. */
  private activeHandler: ((line: string) => void) | null = null;
  /**
   * Set after a timeout, when the engine is still searching and will emit a
   * `bestmove` for a request nobody is waiting for. Without this, that late line
   * would resolve the *next* request with the previous position's evaluation.
   */
  private discardNextBestmove = false;

  constructor(private readonly defaultDepth = 12) {}

  /** Boots the engine. Idempotent — concurrent callers share one boot. */
  async init(): Promise<void> {
    if (this.ready) return this.ready;

    const booting = new Promise<void>((resolve, reject) => {
      let initEngine: (p: string, cb: (err: unknown, e: unknown) => void) => unknown;
      let binPath: string;
      try {
        initEngine = require("stockfish") as typeof initEngine;
        binPath = path.join(path.dirname(require.resolve("stockfish")), "bin", ENGINE_BIN);
      } catch (err) {
        reject(new Error(`Stockfish package not resolvable: ${(err as Error).message}`));
        return;
      }

      try {
        initEngine(binPath, (err, e) => {
          if (err) {
            reject(new Error(`Stockfish failed to start: ${String(err)}`));
            return;
          }
          this.engine = e as EngineModule;
          // One persistent listener; per-request handlers attach through it so
          // engine chatter between requests is dropped rather than logged.
          this.engine.listener = (line: string) => {
            // Consume the flag on the first bestmove seen, whether or not a
            // handler is attached — the abandoned search may finish either side
            // of the next request starting.
            if (line.startsWith("bestmove") && this.discardNextBestmove) {
              this.discardNextBestmove = false;
              return;
            }
            this.activeHandler?.(line);
          };
          this.send("uci");
          resolve();
        });
      } catch (err) {
        reject(err as Error);
      }
    });

    // Clear the cached promise on failure, otherwise a transient boot error is
    // replayed to every later caller and the engine is dead for the process's
    // whole lifetime.
    this.ready = booting.catch((err) => {
      this.ready = null;
      throw err;
    });

    return this.ready;
  }

  /**
   * Evaluates one position.
   *
   * `chess960` must be true for a Chess960 game: castling rights in a 960 FEN are
   * interpreted differently, and a standard-chess engine misreads them.
   */
  async evaluate(fen: string, chess960: boolean, depth = this.defaultDepth): Promise<PositionEval> {
    await this.init();
    return new Promise<PositionEval>((resolve, reject) => {
      this.queue.push({ fen, depth, chess960, resolve, reject });
      void this.drain();
    });
  }

  /** Frees the engine. Safe to call when it never booted. */
  quit(): void {
    // Settle anything still queued, or those callers wait forever.
    const abandoned = this.queue.splice(0);
    for (const request of abandoned) {
      request.reject(new Error("Stockfish engine shut down before this position was evaluated."));
    }

    if (!this.engine) return;
    try {
      this.send("quit");
    } catch {
      // Engine already gone — nothing to release.
    }
    this.engine = null;
    this.ready = null;
    this.activeHandler = null;
  }

  private send(command: string): void {
    if (!this.engine) throw new Error("Stockfish engine is not initialised.");
    this.engine.ccall("command", null, ["string"], [command], {
      async: /^go\b/.test(command),
    });
  }

  private async drain(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const request = this.queue.shift()!;
        try {
          request.resolve(await this.runOne(request));
        } catch (err) {
          request.reject(err as Error);
          // Give the halted search a moment to settle before issuing the next
          // `position`. Sending one mid-search is undefined in UCI.
          await new Promise((r) => setTimeout(r, 250));
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Runs one `go` and collects output until `bestmove`.
   *
   * Times out rather than hanging: a wedged engine must not stall the whole
   * queue and, through it, the request that started the analysis.
   */
  private runOne(request: QueuedRequest): Promise<PositionEval> {
    return new Promise<PositionEval>((resolve, reject) => {
      const engine = this.engine;
      if (!engine) {
        reject(new Error("Stockfish engine is not initialised."));
        return;
      }

      let lastScoreCp: number | null = null;
      let lastMate: number | null = null;
      let lastPv: string[] | null = null;
      let reachedDepth = 0;
      let settled = false;

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.activeHandler = null;
        fn();
      };

      const timer = setTimeout(() => {
        // Halt the abandoned search and swallow the bestmove it still owes us,
        // so it cannot leak into the next request.
        this.discardNextBestmove = true;
        try {
          this.send("stop");
        } catch {
          // Engine is unreachable; the queue drain handles the settle delay.
        }
        finish(() =>
          reject(new Error(`Stockfish timed out evaluating position at depth ${request.depth}.`))
        );
      }, 15_000);

      this.activeHandler = (line: string) => {
        if (line.startsWith("info")) {
          const depthMatch = /\bdepth (\d+)/.exec(line);
          if (depthMatch) reachedDepth = Number(depthMatch[1]);
          const cp = /\bscore cp (-?\d+)/.exec(line);
          if (cp) {
            lastScoreCp = Number(cp[1]);
            lastMate = null;
          }
          const mate = /\bscore mate (-?\d+)/.exec(line);
          if (mate) {
            lastMate = Number(mate[1]);
            lastScoreCp = null;
          }
          const pv = /\bpv (.+)$/.exec(line);
          if (pv) {
            lastPv = pv[1].trim().split(/\s+/);
          }
          return;
        }

        if (line.startsWith("bestmove")) {
          const best = line.split(/\s+/)[1];
          // "(none)" means the position is terminal — checkmate or stalemate.
          // That is the normal end of a finished game, not a failure, so it
          // resolves with a score and no best move.
          const terminal = !best || best === "(none)";
          finish(() =>
            resolve({
              scoreCp: lastMate !== null ? mateToCp(lastMate) : (lastScoreCp ?? 0),
              ...(lastMate !== null ? { mateIn: lastMate } : {}),
              ...(terminal ? {} : { bestMove: best }),
              ...(lastPv ? { pv: lastPv } : {}),
              depth: reachedDepth,
            })
          );
        }
      };

      try {
        if (request.chess960 !== this.chess960Enabled) {
          this.send(`setoption name UCI_Chess960 value ${request.chess960}`);
          this.chess960Enabled = request.chess960;
        }
        this.send(`position fen ${request.fen}`);
        this.send(`go depth ${request.depth}`);
      } catch (err) {
        reportError({
          domain: "anticheat",
          error: err as Error,
          fatal: false,
          context: { fen: request.fen, reason: "engine_send_failed" },
        });
        finish(() => reject(err as Error));
      }
    });
  }
}

/** Collapses a mate score into the centipawn scale so downstream maths stays uniform. */
function mateToCp(mateIn: number): number {
  return mateIn > 0 ? MATE_SCORE_CP - mateIn : -MATE_SCORE_CP - mateIn;
}
