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
import { reportError } from "../realtime/observability/index.js";

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

/**
 * Generous because the first request also pays for loading the model into
 * memory — measured at ~14s on one CPU. Steady-state moves are far quicker;
 * `warmMaiaEngine()` moves that first cost to server start.
 */
const MOVE_TIMEOUT_MS = 90_000;
const BOOT_TIMEOUT_MS = 120_000;
/** Interpreter probe only — must be short so a hung candidate cannot stall boot. */
const PROBE_TIMEOUT_MS = 10_000;

/** Virtualenvs the Dockerfile creates. Probed by path so the env var is optional. */
const VENV_PYTHONS = ["/opt/maia-venv/bin/python", "/opt/venv/bin/python"];

export class MaiaEngine {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private ready: Promise<void> | null = null;
  private readonly queue: QueuedRequest[] = [];
  private processing = false;
  private activeHandler: ((line: string) => void) | null = null;
  /** Partial line buffer — stdout chunks do not respect line boundaries. */
  private stdoutBuffer = "";
  private currentElo: number | null = null;

  /** The interpreter that actually started, once one has. Reported by /status. */
  private resolvedCommand: string | null = null;

  constructor(
    private readonly command = "",
    private readonly model = "maia3-23m"
  ) {}

  /** What launched, or null before the first successful boot. */
  getResolvedCommand(): string | null {
    return this.resolvedCommand;
  }

  /**
   * Reports what each candidate interpreter actually is on this host.
   *
   * Exists because two staging deploys failed with only "could not start" to go
   * on, and distinguishing "no Python" from "Python without maia3" from "wrong
   * Python" needed server-log access. This turns that into one request.
   */
  async diagnose(): Promise<Record<string, string>> {
    const names = [this.command, ...VENV_PYTHONS, "python3", "python"].filter(Boolean) as string[];
    const report: Record<string, string> = {};

    for (const name of names) {
      report[name] = await new Promise<string>((resolve) => {
        let settled = false;
        const done = (value: string) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(value);
        };
        const timer = setTimeout(() => {
          probe.kill();
          done("timed out — likely a shim that never answers");
        }, PROBE_TIMEOUT_MS);

        let out = "";
        const probe = spawn(name, ["-c", "import maia3, sys; print(sys.version.split()[0])"], {
          stdio: ["ignore", "pipe", "pipe"],
        });
        probe.stdout.on("data", (c: Buffer) => (out += c.toString()));
        probe.stderr.on("data", (c: Buffer) => (out += c.toString()));
        probe.on("error", (err) => done(`not runnable — ${err.message}`));
        probe.on("exit", (code) =>
          done(code === 0 ? `maia3 OK on Python ${out.trim()}` : `exit ${code} — ${out.trim().slice(-200)}`)
        );
      });
    }
    return report;
  }

  /**
   * Finds a Python that can import maia3.
   *
   * Probing with `-c "import maia3"` rather than booting the engine per
   * candidate: on Windows `python3` is an App Execution Alias that hangs instead
   * of failing, so a candidate that never answers must not block the next one.
   */
  private async resolvePython(): Promise<string | null> {
    const names = [
      ...(this.command ? [this.command] : []),
      // The image's venv, tried by path. A Railway service variable can shadow
      // the Dockerfile's ENV, so the interpreter must be findable without it.
      ...VENV_PYTHONS,
      "python3",
      "python",
    ];

    for (const name of names) {
      const ok = await new Promise<boolean>((resolve) => {
        let settled = false;
        const done = (value: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(value);
        };
        const timer = setTimeout(() => {
          probe.kill();
          done(false);
        }, PROBE_TIMEOUT_MS);

        const probe = spawn(name, ["-c", "import maia3"], { stdio: "ignore" });
        probe.on("error", () => done(false));
        probe.on("exit", (code) => done(code === 0));
      });

      if (ok) return name;
    }
    return null;
  }

  /** Boots the engine. Idempotent; a failed boot clears itself so it can be retried. */
  async init(): Promise<void> {
    if (this.ready) return this.ready;

    this.ready = (async () => {
      const python = await this.resolvePython();
      if (python) {
        await this.spawnAttempt({
          cmd: python,
          args: ["-m", "maia3.uci", "--model", this.model, "--use-uci-history"],
        });
        return;
      }

      // No importable maia3 — fall back to the console script, which may exist
      // even when the module is installed somewhere this process cannot import.
      const binary = this.command || "maia3-uci";
      try {
        await this.spawnAttempt({
          cmd: binary,
          args: ["--model", this.model, "--use-uci-history"],
        });
      } catch (err) {
        throw new Error(
          `Could not start Maia. No Python could 'import maia3', and '${binary}' failed: ` +
            `${(err as Error).message}. Install with: pip install "git+https://github.com/CSSLab/maia3.git"`
        );
      }
    })().catch((err) => {
      this.ready = null;
      throw err;
    });

    return this.ready;
  }

  /** One spawn attempt. Rejects with the raw error so init() can inspect its code. */
  private spawnAttempt(attempt: { cmd: string; args: string[] }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let proc: ChildProcessWithoutNullStreams;
      try {
        proc = spawn(attempt.cmd, attempt.args, { stdio: ["pipe", "pipe", "pipe"] });
      } catch (err) {
        reject(err);
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`Maia did not report uciok within ${BOOT_TIMEOUT_MS}ms.`));
      }, BOOT_TIMEOUT_MS);

      proc.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
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
          this.resolvedCommand = `${attempt.cmd} ${attempt.args.join(" ")}`;
          resolve();
        }
      };
      this.send("uci");
    });
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
