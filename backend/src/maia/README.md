# Maia-3 — human-like opponent for `/test-maia`

Maia-3 predicts what a **human of a given rating would play**, not the strongest
move. Built for evaluating whether the engine feels human to play against.

Upstream: https://github.com/CSSLab/maia3 (trained on Lichess human games,
Jan 2023 – Jul 2025).

---

## Why this is server-side when Stockfish is not

`frontend/src/shared/hooks/useStockfish.ts` runs Stockfish in a Web Worker — it's
a WASM binary, so it works in the browser. Maia is a **PyTorch model** and cannot.
It therefore runs here as a Python child process, and every move is a network
round trip. That is the only significant architectural difference between the two.

## Deployment requirements

The host running the backend needs **Python plus the `maia3` package**, and
`maia3-uci` on `PATH`. Node alone is not enough.

```bash
pip install "git+https://github.com/CSSLab/maia3.git"
maia3-cache --model maia3-79m    # pre-download weights, or the first request pays for it
```

Weights come from Hugging Face on first use and are cached on disk. **Pre-cache
during the image build** — otherwise the first player waits for a model download.

| Env var | Default | Notes |
|---|---|---|
| `MAIA_ENABLED` | `false` | Off returns 503 from every route here |
| `MAIA_UCI_COMMAND` | *(empty)* | A Python interpreter to prefer. Empty tries `python3`, then `python`, then the `maia3-uci` script |
| `MAIA_MODEL` | `maia3-79m` | Must match the model `nixpacks.toml` pre-caches |

### Thread pinning is not optional

`OMP_NUM_THREADS=1` / `MKL_NUM_THREADS=1` are set in the Dockerfile. Torch sizes
its thread pool from the **host's** core count, not the container's CPU quota,
then thrashes against that quota. On staging this made every move take ~20s, and
made 23M and 79M look almost identical — a tell that the model was never the
bottleneck. Measured on 0.5 CPU: 4.2s per move unpinned versus 0.6s pinned.

Maia is a single forward pass, so extra threads buy nothing regardless.

### Which model

Measured on 0.5 CPU with thread pinning and all weights baked into the image:

| Model | Warm-up | Per move |
|---|---|---|
| `maia3-5m` | 2.5s | ~200ms |
| `maia3-23m` | 4.5s | ~700ms |
| `maia3-79m` | 12s | ~1.9s |

All three are cached in the image, so `MAIA_MODEL` can be changed from the
Railway dashboard with no rebuild and no download. Railway's filesystem is
ephemeral — a model that is not baked in re-downloads on every restart.

Accuracy ranking is 79M > 23M > 5M, per CSSLab. Do not try to judge it by
comparing single moves across Elo settings: Maia samples from a distribution of
plausible human moves rather than returning one best move, so the same position
legitimately yields different moves on repeat calls. Differentiation shows over
many games, not one.

### How the engine is launched

`python -m maia3.uci`, not the `maia3-uci` console script. pip drops that script
into whichever bin directory it likes — `~/.local/bin`, a nix store path, a venv
— and on the first Railway deploy it landed somewhere not on the runtime `PATH`,
producing `spawn maia3-uci ENOENT`. Module invocation only needs the package to
be importable.

Interpreters are probed with `python -c "import maia3"` before the engine is
booted, so a candidate that hangs (on Windows `python3` is an App Execution Alias
that never answers) cannot stall startup.

## API

```
GET  /api/maia/status        → { model, running, command }
GET  /api/maia/status?boot=1 → same, but starts the engine and reports bootError
POST /api/maia/move     { moves: string[], elo: number } → { move, elo, latencyMs }
```

`moves` are UCI moves from the standard starting position. Maia conditions on the
**game so far**, not just the current board, which is why history is required
rather than a FEN.

The route replays the history with chess.js before calling the engine, and
validates Maia's answer before returning it — a move-prediction model is not a
rules engine and must not be trusted to return something legal.

## Measured behaviour

| | |
|---|---|
| Boot | ~2.5s, once per process, lazily |
| Move latency | 50–120ms (`maia3-5m`, CPU) |
| Concurrency | Serialised — a UCI engine holds one position at a time |

Elo conditioning is real and chess-correct. From the same Italian Game position:

| Elo | Move | |
|---|---|---|
| 800 | `c2c3` | passive, aimless |
| 1200 | `O-O` | castles — sensible club player |
| 1600 | `Ng5` | the Fried Liver Attack |
| 2000+ | `d2d3` | the quiet modern main line |

## Notes

- **Standard chess only.** Maia is trained on standard games; it has no Chess960
  support and its predictions there would be meaningless.
- Elo is clamped to 800–2600. Maia's training data thins out beyond that.
- The UI pads Maia's reply to 0.6–1.8s. Answering in 80ms reads as a machine.
- **AGPL-3.0**, code and weights. Fine for a staging experiment. Flagged to the
  founder for a decision before any production use.
