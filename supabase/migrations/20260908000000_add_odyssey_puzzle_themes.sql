-- Adds a flat theme-tag array to odyssey_puzzles (mirrors CuratedPuzzle.themes).
-- Mate-length buckets ("mateIn1", "mateIn2", ...) are represented as tags here
-- too, alongside tactical-motif tags ("fork", "pin", "backRankMate", ...).

ALTER TABLE public.odyssey_puzzles
    ADD COLUMN IF NOT EXISTS themes text[] NOT NULL DEFAULT ARRAY[]::text[];
