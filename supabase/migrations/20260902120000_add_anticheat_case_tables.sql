-- Anti-cheat offender review: cases, penalties, and compensation records.
--
-- Strictly additive: three new tables, no existing table altered, no data
-- removed. Ban state is derived from AppliedPenalty rather than denormalised
-- onto User, so there is no second source of truth to drift on reversal.
--
-- Mirrors the models added to backend/prisma/schema.prisma. No Prisma migration
-- accompanies this file — see reference_docs/DATABASE_MIGRATION_SAFETY_GUIDE.md.

-- The arbiter-facing packet. Self-contained by design: arbiters are external
-- contractors with no platform access, so everything needed to decide is here.
CREATE TABLE public."ReviewCase" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  -- Situation is split into its two components rather than stored as JSON, so a
  -- case queue can be filtered by either without parsing.
  "proficiency" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  -- TEXT, not an enum: statuses and penalty actions are policy that grows by
  -- rows, and an enum would make every addition a migration.
  "status" TEXT NOT NULL DEFAULT 'open',
  -- Every DetectionOutcome that contributed. A second detection on an open case
  -- appends here instead of opening a duplicate or being discarded.
  "outcomes" JSONB NOT NULL,
  "evidence" JSONB NOT NULL,
  -- Captured at open time. Affected Users are the opponents in these games only;
  -- re-deriving them later would score against policy values that have moved.
  "flaggedGameRecordIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedArbiterId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolutionNotes" TEXT,
  "upheld" BOOLEAN,
  "arbiterConfidence" DOUBLE PRECISION,
  "suspectStatement" TEXT,
  -- The appeal lives on the case rather than in its own table: one appeal per
  -- case, and no independent-reviewer workflow exists to justify more.
  "appealStatus" TEXT,
  "appealGrounds" TEXT,
  "appealedAt" TIMESTAMP(3),
  "appealDecidedAt" TIMESTAMP(3),
  "appealDecisionReasoning" TEXT,

  CONSTRAINT "ReviewCase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReviewCase_userId_idx" ON public."ReviewCase" ("userId");
CREATE INDEX "ReviewCase_status_idx" ON public."ReviewCase" ("status");
CREATE INDEX "ReviewCase_openedAt_idx" ON public."ReviewCase" ("openedAt");

ALTER TABLE public."ReviewCase"
  ADD CONSTRAINT "ReviewCase_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public."User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- One consequence. caseId is NOT NULL because an unappealable penalty violates a
-- stated goal of the spec — the database refuses one rather than the code
-- remembering to.
CREATE TABLE public."AppliedPenalty" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "level" INTEGER NOT NULL,
  "proficiency" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Null means it does not expire. Temporary bans lapse by comparison at the
  -- gate; nothing sweeps this table.
  "expiresAt" TIMESTAMP(3),
  "reversed" BOOLEAN NOT NULL DEFAULT false,
  "reversedAt" TIMESTAMP(3),
  "reversalReason" TEXT,

  CONSTRAINT "AppliedPenalty_pkey" PRIMARY KEY ("id")
);

-- Serves the ban gate at matchmaking entry. The gate's predicate is an OR over
-- expiresAt (null for permanent bans), which this index will only partly serve;
-- accepted at current volume.
CREATE INDEX "AppliedPenalty_userId_reversed_expiresAt_idx"
  ON public."AppliedPenalty" ("userId", "reversed", "expiresAt");

CREATE INDEX "AppliedPenalty_caseId_idx" ON public."AppliedPenalty" ("caseId");

ALTER TABLE public."AppliedPenalty"
  ADD CONSTRAINT "AppliedPenalty_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public."User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public."AppliedPenalty"
  ADD CONSTRAINT "AppliedPenalty_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES public."ReviewCase"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- One restoration or payout to one Affected User.
CREATE TABLE public."CompensationRecord" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  -- Null for case-scoped compensation (an acknowledgement); set for anything
  -- owed because of one specific game.
  "gameRecordId" TEXT,
  "ratingPointsRestored" INTEGER,
  "amountMinorUnits" INTEGER,
  "currency" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,

  CONSTRAINT "CompensationRecord_pkey" PRIMARY KEY ("id")
);

-- A duplicated payout is unrecoverable, so uniqueness is enforced here rather
-- than trusted to the caller. Two partial indexes because gameRecordId is
-- nullable and NULLs do not collide in a plain unique index.
--
-- INVISIBLE TO PRISMA: partial unique indexes cannot be expressed in
-- schema.prisma, so the generated client offers no compound key for them. The
-- code catches P2002 instead of relying on upsert. Do not "fix" this by adding
-- an @@unique — that would generate a different, non-partial index.
CREATE UNIQUE INDEX "CompensationRecord_case_user_kind_game_key"
  ON public."CompensationRecord" ("caseId", "userId", "kind", "gameRecordId")
  WHERE "gameRecordId" IS NOT NULL;

CREATE UNIQUE INDEX "CompensationRecord_case_user_kind_key"
  ON public."CompensationRecord" ("caseId", "userId", "kind")
  WHERE "gameRecordId" IS NULL;

CREATE INDEX "CompensationRecord_userId_idx" ON public."CompensationRecord" ("userId");
CREATE INDEX "CompensationRecord_caseId_idx" ON public."CompensationRecord" ("caseId");

ALTER TABLE public."CompensationRecord"
  ADD CONSTRAINT "CompensationRecord_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public."User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public."CompensationRecord"
  ADD CONSTRAINT "CompensationRecord_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES public."ReviewCase"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public."CompensationRecord"
  ADD CONSTRAINT "CompensationRecord_gameRecordId_fkey"
  FOREIGN KEY ("gameRecordId") REFERENCES public."GameRecord"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
