-- Renames the arbiter-era columns on ReviewCase.
--
-- Cases are decided by the system on detection, or reversed by an admin. There
-- is no external arbiter in the flow, so the column names no longer describe
-- what they hold.
--
-- Rename only. No column is added or dropped and no row is touched.

ALTER TABLE public."ReviewCase"
  RENAME COLUMN "assignedArbiterId" TO "decidedById";

ALTER TABLE public."ReviewCase"
  RENAME COLUMN "arbiterConfidence" TO "decisionConfidence";
