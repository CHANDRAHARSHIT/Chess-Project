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
| `MAIA_UCI_COMMAND` | `maia3-uci` | Override if the binary is not on `PATH` |
| `MAIA_MODEL` | `maia3-79m` | Must match the model `nixpacks.toml` pre-caches |

### Which model

Measured on the same Italian Game position:

| | `maia3-5m` | `maia3-79m` |
|---|---|---|
| Disk | 21 MB | 302 MB |
| Boot | ~1.8s | ~1.4s |
| Avg move | ~40ms | ~236ms |
| 800 / 1200 / 1600 / 2000 / 2600 | `O-O` `Ng5` `d3` `d3` `d3` | `c3` `Nc3` `O-O` `d3` `O-O` |

**79M is the default.** 5M collapses the top three bands onto one move, which
defeats the strength selector. 236ms is invisible behind the UI's 600–1800ms
reply delay, so the only real cost is disk and memory.

## API

```
GET  /api/maia/status   → { model, running }
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
