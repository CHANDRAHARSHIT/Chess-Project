-- Migration: add_odyssey_game
-- Adds OdysseyGame table to persist Odyssey (Story Mode) run state.
-- Each user has up to 3 rows (one per save slot); (userId, slotId) is UNIQUE.

CREATE TABLE public."OdysseyGame" (
  id                text                           NOT NULL,
  "userId"          text                           NOT NULL,
  "slotId"          integer                        NOT NULL,
  "playerType"      text,
  coins             integer                        DEFAULT 50 NOT NULL,
  relics            jsonb                          DEFAULT '[]'::jsonb NOT NULL,
  "completedNodes"  integer[]                      DEFAULT ARRAY[]::integer[],
  "currentNodeId"   integer                        DEFAULT -1 NOT NULL,
  "journeyComplete" boolean                        DEFAULT false NOT NULL,
  "mapNodes"        jsonb                          NOT NULL,
  "playtimeSeconds" integer                        DEFAULT 0 NOT NULL,
  "updatedAt"       timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."OdysseyGame"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."OdysseyGame"
  ADD CONSTRAINT "OdysseyGame_pkey" PRIMARY KEY (id);

ALTER TABLE public."OdysseyGame"
  ADD CONSTRAINT "OdysseyGame_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public."User"(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

CREATE UNIQUE INDEX "OdysseyGame_userId_slotId_key" ON public."OdysseyGame" ("userId", "slotId");

GRANT ALL ON public."OdysseyGame" TO anon;
GRANT ALL ON public."OdysseyGame" TO authenticated;
GRANT ALL ON public."OdysseyGame" TO service_role;

-- ── Row Level Security Policies ─────────────────────────────────────────────

CREATE POLICY "Users can view own odyssey games" ON public."OdysseyGame"
  FOR SELECT
  TO authenticated
  USING (((auth.uid())::text = "userId"));

CREATE POLICY "Users can insert own odyssey games" ON public."OdysseyGame"
  FOR INSERT
  TO authenticated
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "Users can update own odyssey games" ON public."OdysseyGame"
  FOR UPDATE
  TO authenticated
  USING (((auth.uid())::text = "userId"))
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "Users can delete own odyssey games" ON public."OdysseyGame"
  FOR DELETE
  TO authenticated
  USING (((auth.uid())::text = "userId"));
