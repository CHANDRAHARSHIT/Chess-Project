-- CreateEnum
CREATE TYPE "MatchProvenance" AS ENUM ('queue', 'tournament', 'invite', 'bot', 'internal');

-- CreateEnum
CREATE TYPE "GameOutcomeKind" AS ENUM ('win', 'draw');

-- CreateEnum
CREATE TYPE "GameParticipantResult" AS ENUM ('WIN', 'LOSS', 'DRAW');

-- CreateEnum
CREATE TYPE "GameTerminationReason" AS ENUM ('checkmate', 'stalemate', 'draw_agreement', 'draw_repetition', 'draw_fifty_move', 'draw_insufficient_material', 'resignation', 'timeout', 'forfeit', 'abort');

-- CreateTable
CREATE TABLE "GameRecord" (
    "id" TEXT NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "rated" BOOLEAN NOT NULL,
    "provenance" "MatchProvenance" NOT NULL,
    "outcomeKind" "GameOutcomeKind" NOT NULL,
    "winningSide" INTEGER,
    "terminationReason" "GameTerminationReason" NOT NULL,
    "moveCount" INTEGER NOT NULL,
    "moveHistory" JSONB,
    "initialSeconds" INTEGER,
    "incrementSeconds" INTEGER,
    "timeControlLabel" TEXT,
    "ratingPoolId" TEXT,
    "tournamentContext" JSONB,
    "metadata" JSONB,
    "durationSeconds" INTEGER,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameParticipant" (
    "id" TEXT NOT NULL,
    "gameRecordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" INTEGER NOT NULL,
    "result" "GameParticipantResult" NOT NULL,
    "ratingBefore" INTEGER,
    "ratingAfter" INTEGER,
    "ratingDelta" INTEGER,

    CONSTRAINT "GameParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1200,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameRecord_gameSessionId_key" ON "GameRecord"("gameSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRecord_matchId_key" ON "GameRecord"("matchId");

-- CreateIndex
CREATE INDEX "GameRecord_endedAt_idx" ON "GameRecord"("endedAt");

-- CreateIndex
CREATE INDEX "GameRecord_variantId_idx" ON "GameRecord"("variantId");

-- CreateIndex
CREATE INDEX "GameParticipant_userId_idx" ON "GameParticipant"("userId");

-- CreateIndex
CREATE INDEX "GameParticipant_userId_result_idx" ON "GameParticipant"("userId", "result");

-- CreateIndex
CREATE UNIQUE INDEX "GameParticipant_gameRecordId_userId_key" ON "GameParticipant"("gameRecordId", "userId");

-- CreateIndex
CREATE INDEX "PlayerRating_variantId_rating_idx" ON "PlayerRating"("variantId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRating_userId_variantId_key" ON "PlayerRating"("userId", "variantId");

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_gameRecordId_fkey" FOREIGN KEY ("gameRecordId") REFERENCES "GameRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRating" ADD CONSTRAINT "PlayerRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
