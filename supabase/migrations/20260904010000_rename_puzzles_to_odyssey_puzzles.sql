-- Renames the initial-puzzle-collection table/type to make it clear these are
-- Odyssey story-mode puzzles, distinct from the pre-existing CuratedPuzzle
-- dataset. Uses RENAME (not drop/recreate) so the 500 already-generated,
-- Stockfish-verified puzzles are preserved.

ALTER TYPE public."PuzzleType" RENAME TO "OdysseyPuzzleType";

ALTER TABLE public.puzzles RENAME TO odyssey_puzzles;

ALTER TABLE public.odyssey_puzzles RENAME CONSTRAINT puzzles_pkey TO odyssey_puzzles_pkey;
ALTER TABLE public.odyssey_puzzles RENAME CONSTRAINT puzzles_fen_key TO odyssey_puzzles_fen_key;

ALTER INDEX public.puzzles_type_matein_idx RENAME TO odyssey_puzzles_type_matein_idx;

ALTER POLICY "Anyone can view puzzles" ON public.odyssey_puzzles RENAME TO "Anyone can view odyssey puzzles";
ALTER POLICY "Service role can manage puzzles" ON public.odyssey_puzzles RENAME TO "Service role can manage odyssey puzzles";
