-- Replaces the flat themes[] column with a proper many-to-many mapping table,
-- so a puzzle can carry several theme tags without denormalized arrays.
-- Theme codes match Lichess's own puzzle-theme vocabulary.

ALTER TABLE public.odyssey_puzzles DROP COLUMN IF EXISTS themes;

CREATE TABLE IF NOT EXISTS public.odyssey_puzzle_themes (
    "puzzleId" text NOT NULL,
    theme      text NOT NULL,
    CONSTRAINT odyssey_puzzle_themes_pkey PRIMARY KEY ("puzzleId", theme),
    CONSTRAINT odyssey_puzzle_themes_puzzleId_fkey FOREIGN KEY ("puzzleId")
        REFERENCES public.odyssey_puzzles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS odyssey_puzzle_themes_theme_idx ON public.odyssey_puzzle_themes (theme);

ALTER TABLE public.odyssey_puzzle_themes ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.odyssey_puzzle_themes TO anon;
GRANT ALL ON public.odyssey_puzzle_themes TO authenticated;
GRANT ALL ON public.odyssey_puzzle_themes TO service_role;

CREATE POLICY "Anyone can view odyssey puzzle themes" ON public.odyssey_puzzle_themes
    FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage odyssey puzzle themes" ON public.odyssey_puzzle_themes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
