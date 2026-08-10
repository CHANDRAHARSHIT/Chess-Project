-- Migration: add_pathway_progress
-- Adds PathwayProgress table to persist per-user pathway puzzle progress.
-- Each user has at most one row (userId is UNIQUE).

CREATE TABLE public."PathwayProgress" (
  id             text                           NOT NULL,
  "userId"       text                           NOT NULL,
  "completedIds" text[]                         DEFAULT ARRAY[]::text[],
  streak         integer                        DEFAULT 0 NOT NULL,
  "totalSolved"  integer                        DEFAULT 0 NOT NULL,
  "updatedAt"    timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."PathwayProgress"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."PathwayProgress"
  ADD CONSTRAINT "PathwayProgress_pkey" PRIMARY KEY (id);

ALTER TABLE public."PathwayProgress"
  ADD CONSTRAINT "PathwayProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public."User"(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

CREATE UNIQUE INDEX "PathwayProgress_userId_key" ON public."PathwayProgress" ("userId");

GRANT ALL ON public."PathwayProgress" TO anon;
GRANT ALL ON public."PathwayProgress" TO authenticated;
GRANT ALL ON public."PathwayProgress" TO service_role;

-- ── Row Level Security Policies ─────────────────────────────────────────────

CREATE POLICY "Users can view own pathway progress" ON public."PathwayProgress"
  FOR SELECT
  TO authenticated
  USING (((auth.uid())::text = "userId"));

CREATE POLICY "Users can insert own pathway progress" ON public."PathwayProgress"
  FOR INSERT
  TO authenticated
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "Users can update own pathway progress" ON public."PathwayProgress"
  FOR UPDATE
  TO authenticated
  USING (((auth.uid())::text = "userId"))
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "No client deletes on pathway progress" ON public."PathwayProgress"
  FOR DELETE
  TO authenticated
  USING (false);
