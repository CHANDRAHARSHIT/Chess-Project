-- CreateTable: CuratedPuzzle
-- Stores curated Lichess puzzles for the Custom Puzzles feature.
-- Filterable by rating range and themes (Postgres array column).

CREATE TABLE "CuratedPuzzle" (
    "id"              TEXT NOT NULL,
    "fen"             TEXT NOT NULL,
    "moves"           TEXT NOT NULL,
    "rating"          INTEGER NOT NULL,
    "ratingDeviation" INTEGER NOT NULL,
    "popularity"      INTEGER NOT NULL,
    "nbPlays"         INTEGER NOT NULL,
    "themes"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuratedPuzzle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for fast rating-range filtering
CREATE INDEX "CuratedPuzzle_rating_idx" ON "CuratedPuzzle"("rating");
