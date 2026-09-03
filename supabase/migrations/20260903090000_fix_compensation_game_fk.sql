-- Fixes a defect in 20260902120000_add_anticheat_case_tables.sql.
--
-- CompensationRecord.gameRecordId was ON DELETE SET NULL. Nulling that column
-- moves the row into the case-scoped partial unique index
-- (caseId, userId, kind) WHERE gameRecordId IS NULL — and a user owed one record
-- per flagged game has several rows sharing that key, so deleting a GameRecord
-- failed on a duplicate-key error from a constraint the caller never touched.
--
-- RESTRICT instead: a compensation record is an obligation, so a game it refers
-- to cannot be deleted out from under it. Erasing or nulling the record would
-- lose the fact that someone is owed something.
--
-- Constraint swap only. No column, index or row is added, altered or removed.

ALTER TABLE public."CompensationRecord"
  DROP CONSTRAINT "CompensationRecord_gameRecordId_fkey";

ALTER TABLE public."CompensationRecord"
  ADD CONSTRAINT "CompensationRecord_gameRecordId_fkey"
  FOREIGN KEY ("gameRecordId") REFERENCES public."GameRecord"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
