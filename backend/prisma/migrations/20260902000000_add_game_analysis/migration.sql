-- Cached per-game engine analysis. Strictly additive: one new table, no change
-- to any existing table, no data removed, no backfill.
--
-- Hand-written rather than generated, because `prisma migrate dev` would also
-- emit DDL for the pre-existing Course/Lesson/CustomLink/Opening schema drift
-- recorded in AGENTS.md, which is out of scope here.

-- CreateTable
CREATE TABLE "GameAnalysis" (
    "id" TEXT NOT NULL,
    "gameRecordId" TEXT NOT NULL,
    "engineName" TEXT NOT NULL,
    "engineDepth" INTEGER NOT NULL,
    "multiPvLines" INTEGER NOT NULL DEFAULT 1,
    "startingFen" TEXT NOT NULL,
    "plyCount" INTEGER NOT NULL,
    "plies" JSONB NOT NULL,
    "payloadVersion" INTEGER NOT NULL DEFAULT 1,
    "analysedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameAnalysis_gameRecordId_key" ON "GameAnalysis"("gameRecordId");

-- CreateIndex
CREATE INDEX "GameAnalysis_analysedAt_idx" ON "GameAnalysis"("analysedAt");

-- AddForeignKey
ALTER TABLE "GameAnalysis" ADD CONSTRAINT "GameAnalysis_gameRecordId_fkey" FOREIGN KEY ("gameRecordId") REFERENCES "GameRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
