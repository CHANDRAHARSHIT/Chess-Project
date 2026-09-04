-- Initial Puzzle Collection: puzzles table for Stockfish-verified, real-game-derived
-- chess puzzles. Populated by a one-off manual script (backend/src/scripts), not by
-- any API/service yet — this migration only creates the storage.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PuzzleType') THEN
        CREATE TYPE public."PuzzleType" AS ENUM ('FIND_MATE', 'BEST_MOVE');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.puzzles (
    id                       text                           NOT NULL DEFAULT gen_random_uuid()::text,
    fen                      text                           NOT NULL,
    solution                 jsonb                          NOT NULL,
    "puzzleRatingDifficulty" integer                        NOT NULL,
    type                     public."PuzzleType"            NOT NULL,
    "mateIn"                 integer,
    source                   text,
    "createdAt"              timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt"              timestamp(3) without time zone NOT NULL
);

ALTER TABLE public.puzzles
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.puzzles
    ADD CONSTRAINT puzzles_pkey PRIMARY KEY (id);

ALTER TABLE public.puzzles
    ADD CONSTRAINT puzzles_fen_key UNIQUE (fen);

CREATE INDEX IF NOT EXISTS puzzles_type_mateIn_idx ON public.puzzles (type, "mateIn");

GRANT ALL ON public.puzzles TO anon;
GRANT ALL ON public.puzzles TO authenticated;
GRANT ALL ON public.puzzles TO service_role;

CREATE POLICY "Anyone can view puzzles" ON public.puzzles
    FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage puzzles" ON public.puzzles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
