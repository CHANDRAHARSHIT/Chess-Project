-- Penalty actions as data, so new consequences are rows rather than code.
--
-- Named PenaltyAction, not Action: backend/src/events/ already owns an "action"
-- concept (the trigger/action table that runs blunder_analysis and friends), and
-- a bare Action table would read as that one.
--
-- `isImplemented` is deliberate. The list is expected to grow well past what the
-- code can currently carry out, so a row records that an action EXISTS; this
-- column records whether anything actually happens when it is applied.
--
-- Strictly additive: one new table, one seed of it, plus a foreign key on the
-- existing AppliedPenalty.action column. No data is removed.

CREATE TABLE public."PenaltyAction" (
  "id" TEXT NOT NULL,
  -- Machine name, matching the PenaltyAction union in anticheat/types.ts.
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  -- Drives the matchmaking ban gate. Adding a blocking action needs no code change.
  "blocksPlay" BOOLEAN NOT NULL DEFAULT false,
  -- Null never expires. Applied at penalty time to compute expiresAt.
  "defaultDurationMs" BIGINT,
  -- False = the action can be recorded, but nothing is wired to carry it out yet.
  "isImplemented" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  -- Ascending severity, so a ladder can be expressed without hardcoding order.
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PenaltyAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PenaltyAction_code_key" ON public."PenaltyAction" ("code");

INSERT INTO public."PenaltyAction"
  ("id", "code", "label", "description", "blocksPlay", "defaultDurationMs", "isImplemented", "sortOrder")
VALUES
  ('pa_increase_monitoring', 'increase_monitoring', 'Increase Monitoring',
   'Analyse every game for this user rather than a sample.',
   false, 2592000000, false, 1),
  ('pa_warning', 'warning', 'Warning',
   'Notify the user that their play has been flagged.',
   false, NULL, false, 2),
  ('pa_strike', 'strike', 'Strike',
   'Record a formal strike against the account.',
   false, NULL, false, 3),
  ('pa_restrict_prize', 'restrict_from_prize_events', 'Restrict From Prize Events',
   'Block entry to events awarding a prize.',
   false, 7776000000, false, 4),
  ('pa_restrict_rated', 'restrict_from_rated_events', 'Restrict From Rated Events',
   'Block entry to rated play while unrated play continues.',
   false, 7776000000, false, 5),
  ('pa_suspend_event', 'suspend_from_current_event', 'Suspend From Current Event',
   'Remove the user from the event in progress.',
   false, NULL, false, 6),
  ('pa_temporary_ban', 'temporary_ban', 'Temporary Ban',
   'Block the user from starting games until the ban expires. Sign-in and lessons are unaffected.',
   true, 2592000000, true, 7),
  ('pa_permanent_ban', 'permanent_ban', 'Permanent Ban',
   'Block the user from starting games indefinitely. Sign-in and lessons are unaffected.',
   true, NULL, true, 8);

-- A penalty may only cite an action that exists, enforced by the database rather
-- than by request validation alone.
ALTER TABLE public."AppliedPenalty"
  ADD CONSTRAINT "AppliedPenalty_action_fkey"
  FOREIGN KEY ("action") REFERENCES public."PenaltyAction"("code")
  ON DELETE RESTRICT ON UPDATE CASCADE;
