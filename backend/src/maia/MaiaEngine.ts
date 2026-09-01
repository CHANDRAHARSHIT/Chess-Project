/**
 * Maia-3 adapter — a UCI engine that predicts what a HUMAN of a given Elo would
 * play, rather than the strongest move.
 *
 * Runs as a Python child process (`maia3-uci`), so unlike Stockfish it cannot run
 * in the browser: Maia is a PyTorch model. Every move therefore costs a round
 * trip to this server.
 *
 * Requests are serialised because a UCI engine holds one position at a time —
 * two concurrent `go` commands would interleave and return each other's moves.
 */

import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { reportError } from "../observability/index.js";

export interface MaiaMoveRequest {
  /** Moves from the standard start, in UCI ("e2e4"). Maia conditions on history. */
  readonly moves: readonly string[];
  /** Rating Maia should imitate. */
  readonly elo: number;
}

export interface MaiaMoveResult {
  /** The chosen move in UCI. */
  readonly move: string;
  readonly elo: number;
  readonly latencyMs: number;
}

interface QueuedRequest {
  readonly request: MaiaMoveRequest;
  readonly resolve: (value: MaiaMoveResult) => void;
  readonly reject: (err: Error) => void;
}

/** Maia's training data thins out at the extremes; clamp to a sane band. */
const MIN_ELO = 800;
const MAX_ELO = 2600;

const MOVE_TIMEOUT_MS = 20_000;
const BOOT_TIMEOUT_MS = 120_000;

export class MaiaEngine {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private ready: Promise<void> | null = null;
  private readonly queue: QueuedRequest[] = [];
  private processing = false;
  private activeHandler: ((line: string) => void) | null = null;
  /** Partial line buffer — stdout chunks do not respect line boundaries. */
  private stdoutBuffer = "";
  private currentElo: number | null = null;

  constructor(
    private readonly command = "maia3-uci",
    private readonly model = "maia3-5m"
  ) {}

  /** Boots the engine. Idempotent; a failed boot clears itself so it can be retried. */
  async init(): Promise<void> {
    if (this.ready) return this.ready;

    const booting = new Promise<void>((resolve, reject) => {
      let proc: ChildProcessWithoutNullStreams;
      try {
        proc = spawn(this.command, ["--model", this.model, "--use-uci-history"], {
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (err) {
        reject(new Error(`Could not start Maia (${this.command}): ${(err as Error).message}`));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`Maia did not report uciok within ${BOOT_TIMEOUT_MS}ms.`));
      }, BOOT_TIMEOUT_MS);

      proc.on("error", (err) => {
        clearTimeout(timer);
        reject(new Error(`Maia process error: ${err.message}. Is '${this.command}' on PATH?`));
      });

      proc.on("exit", (code) => {
        // A dead engine must not leave callers waiting on a process that is gone.
        this.proc = null;
        this.ready = null;
        this.failAll(new Error(`Maia process exited (code ${code}).`));
      });

      proc.stdout.on("data", (chunk: Buffer) => this.onStdout(chunk.toString()));
      // Model download progress and warnings arrive here; not errors on their own.
      proc.stderr.on("data", () => {});

      this.proc = proc;
      this.activeHandler = (line) => {
        if (line.startsWith("uciok")) {
          clearTimeout(timer);
          this.activeHandler = null;
          resolve();
        }
      };
      this.send("uci");
    });

    this.ready = booting.catch((err) => {
      this.ready = null;
      throw err;
    });
    return this.ready;
  }

  /** Asks Maia for the move a player of `elo` would most likely play. */
  async getMove(request: MaiaMoveRequest): Promise<MaiaMoveResult> {
    await this.init();
    return new Promise<MaiaMoveResult>((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      void this.drain();
    });
  }

  /** True once the engine has booted and is accepting requests. */
  isRunning(): boolean {
    return this.proc !== null;
  }

  stop(): void {
    this.failAll(new Error("Maia engine shut down before this request was served."));
    if (!this.proc) return;
    try {
      this.send("quit");
      this.proc.kill();
    } catch {
      // Already gone.
    }
    this.proc = null;
    this.ready = null;
    this.activeHandler = null;
  }

  private failAll(err: Error): void {
    for (const queued of this.queue.splice(0)) queued.reject(err);
  }

  private send(command: string): void {
    if (!this.proc) throw new Error("Maia engine is not running.");
    this.proc.stdin.write(`${command}\n`);
  }

  private onStdout(chunk: string): void {
    this.stdoutBuffer += chunk;
    const lines = this.stdoutBuffer.split(/\r?\n/);
    // Trailing element is an incomplete line; keep it for the next chunk.
    this.stdoutBuffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) this.activeHandler?.(trimmed);
    }
  }

  private async drain(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const queued = this.queue.shift()!;
        try {
          queued.resolve(await this.runOne(queued.request));
        } catch (err) {
          queued.reject(err as Error);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private runOne(request: MaiaMoveRequest): Promise<MaiaMoveResult> {
    return new Promise<MaiaMoveResult>((resolve, reject) => {
      if (!this.proc) {
        reject(new Error("Maia engine is not running."));
        return;
      }

      const elo = clampElo(request.elo);
      const startedAt = Date.now();
      let settled = false;

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.activeHandler = null;
        fn();
      };

      const timer = setTimeout(() => {
        finish(() => reject(new Error(`Maia timed out after ${MOVE_TIMEOUT_MS}ms.`)));
      }, MOVE_TIMEOUT_MS);

      this.activeHandler = (line) => {
        if (!line.startsWith("bestmove")) return;
        const move = line.split(/\s+/)[1];
        if (!move || move === "(none)") {
          finish(() => reject(new Error("Maia returned no move; the position may be terminal.")));
          return;
        }
        finish(() => resolve({ move, elo, latencyMs: Date.now() - startedAt }));
      };

      try {
        // Only resend Elo when it changes — it is engine-wide state, not per-search.
        if (elo !== this.currentElo) {
          this.send(`setoption name Elo value ${elo}`);
          this.currentElo = elo;
        }
        const moves = request.moves.length > 0 ? ` moves ${request.moves.join(" ")}` : "";
        this.send(`position startpos${moves}`);
        // Maia is a single forward pass — it does not search, so one node is the
        // whole computation. Depth/time limits would be meaningless here.
        this.send("go nodes 1");
      } catch (err) {
        reportError({
          domain: "maia",
          error: err as Error,
          fatal: false,
          context: { elo, moveCount: request.moves.length },
        });
        finish(() => reject(err as Error));
      }
    });
  }
}

function clampElo(elo: number): number {
  if (!Number.isFinite(elo)) return 1500;
  return Math.max(MIN_ELO, Math.min(MAX_ELO, Math.round(elo)));
}
