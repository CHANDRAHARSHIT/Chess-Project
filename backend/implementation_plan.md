# Stage 5 Implementation Plan

## Goal
Implement time-trouble frequency analysis, score correlation with time trouble, and identification of rushed critical moves.

## Open Questions / Clarifications
- Since Stage 4's engine evaluation takes ~5-8 seconds per game sequentially, I plan to store the `evaluations` array directly on each game record in `opponentGames.json` during ingestion and backfill. This keeps `getStats()` synchronous and fast. *Note: As the dataset grows, blocking ingestion for 8 seconds per game will become a bottleneck. We will need an async job queue later, but per the YAGNI constraint, I am proceeding with synchronous sequential evaluation for now.*
- Does the 30-second time trouble cutoff and 2-second "fast move" cutoff sound reasonable for this initial implementation?

## Confirmations & Decisions
1. **Time Trouble Thresholds (Relative):** 
   - We will parse `timeControl` (e.g., "180+1") to extract the base time in seconds (180).
   - *Time Trouble:* Defined as remaining time dropping below **15% of base time**. (For a 3-minute blitz game, this is 27 seconds, closely aligning with the universally recognized ~30s blitz time-trouble mark).
   - *Fast Move:* Defined as time spent being **< 30% of their average time-per-move** for that specific game. 
   - Games with missing or unparseable `timeControl` will gracefully fall into the `unusable` time-analysis bucket.

2. **`chess.js` Comment FEN mapping:** 
   - `chess.js` maps comments via `this._comments[this.fen()]`. `this.fen()` generates a standard FEN which includes the **fullmove number** and **side to move**. Because the tuple `(side to move, fullmove number)` strictly monotonically advances every single ply in a linear chess game, **every FEN in a game is mathematically guaranteed to be strictly unique**. There is zero risk of comment misattribution, even in positional board repetitions.

3. **Eval-Swing Calculation:**
   - We will use the `evaluationWhitePerspective` field from Stage 4.
   - If the opponent is **Black**, a swing *against* them means White's eval increased: `swing = evalAfter - evalBefore`.
   - If the opponent is **White**, a swing *against* them means White's eval decreased: `swing = evalBefore - evalAfter`.
   - The threshold for a "large swing" will be **>= 150 centipawns**.

## Proposed Changes

### 1. Clock Extraction & Backfill (`opponent.service.ts`)
- **Extraction:** Use `chess.js`'s `.getComments()` method. Match the FEN after a move with the FEN in the comment objects, parse `[%clk H:MM:SS]`, and append `clock: number` (seconds remaining) to the `moves` array elements.
- **Backfill:** Add `backfillClocksAndEvals()` which iterates over all stored games:
  - Reparse `rawPgn` to extract clocks and add them to `moves`.
  - Add `evaluations` array to the game object using `EngineService.evaluateGame`.

### 2. Time Analysis Logic (`opponent.service.ts`)
Update `getStats(username)` to return a new `timeAnalysis` object.
- **Coverage:** Filter to games that have valid clock data and a parseable `timeControl`.
- **Time Trouble Frequency & Score:** Group games into `timeTroubleGames` and `noTimeTroubleGames` based on the 15% threshold, and compute `scorePercentage` separately.
- **Fast Moves in Critical Positions:** Scan the opponent's moves. If `timeSpent < 0.3 * averageTimePerMove` and the immediate `evalSwing >= 150` against them, flag it as a rushed critical decision.

## Verification Plan
1. Call `OpponentService.backfillClocksAndEvals()` in the test script.
2. Call `OpponentService.getStats()` and verify that the `timeAnalysis` block correctly outputs time trouble stats, coverage (usable vs unusable games), and rushed critical moves.
