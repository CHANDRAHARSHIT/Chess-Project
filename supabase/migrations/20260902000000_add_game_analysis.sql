-- Cached per-game engine analysis, consumed by the anti-cheat multi-game review.
--
-- Stores raw engine output only (per-ply evaluations and best moves), never
-- derived blunder/accuracy classifications: those depend on tunable policy
-- values, so persisting them would force a full re-analysis of every game
-- whenever a threshold changes.
--
-- Strictly additive: one new table, no existing table altered, no data removed.
-- Mirrors backend/prisma/migrations/20260902000000_add_game_analysis.

CREATE TABLE public."GameAnalysis" (
  "id" TEXT NOT NULL,
  "gameRecordId" TEXT NOT NULL,
  "engineName" TEXT NOT NULL,
  "engineDepth" INTEGER NOT NULL,
  "multiPvLines" INTEGER NOT NULL DEFAULT 1,
  "startingFen" TEXT NOT NULL,
  "plyCount" INTEGER NOT NULL,
  "plies" JSONB NOT NULL,
  "payloadVersion" INTEGER NOT NULL DEFAULT 1,
  "analysedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GameAnalysis_pkey" PRIMARY KEY ("id")
);

-- One analysis per game; re-analysing replaces the row rather than adding one.
CREATE UNIQUE INDEX "GameAnalysis_gameRecordId_key"
  ON public."GameAnalysis" ("gameRecordId");

CREATE INDEX "GameAnalysis_analysedAt_idx"
  ON public."GameAnalysis" ("analysedAt");

ALTER TABLE public."GameAnalysis"
  ADD CONSTRAINT "GameAnalysis_gameRecordId_fkey"
  FOREIGN KEY ("gameRecordId") REFERENCES public."GameRecord"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
