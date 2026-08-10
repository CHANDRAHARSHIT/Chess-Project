-- Results & Rating migration
-- Creates the persistent game history and rating tables consumed by the
-- backend Results listener and read-only Games APIs.

CREATE TYPE public."MatchProvenance" AS ENUM ('queue', 'tournament', 'invite', 'bot', 'internal');

CREATE TYPE public."GameOutcomeKind" AS ENUM ('win', 'draw');

CREATE TYPE public."GameParticipantResult" AS ENUM ('WIN', 'LOSS', 'DRAW');

CREATE TYPE public."GameTerminationReason" AS ENUM (
  'checkmate',
  'stalemate',
  'draw_agreement',
  'draw_repetition',
  'draw_fifty_move',
  'draw_insufficient_material',
  'resignation',
  'timeout',
  'forfeit',
  'abort'
);

CREATE TABLE public."GameRecord" (
  "id" TEXT NOT NULL,
  "gameSessionId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "rated" BOOLEAN NOT NULL,
  "provenance" public."MatchProvenance" NOT NULL,
  "outcomeKind" public."GameOutcomeKind" NOT NULL,
  "winningSide" INTEGER,
  "terminationReason" public."GameTerminationReason" NOT NULL,
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

CREATE TABLE public."GameParticipant" (
  "id" TEXT NOT NULL,
  "gameRecordId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "side" INTEGER NOT NULL,
  "result" public."GameParticipantResult" NOT NULL,
  "ratingBefore" INTEGER,
  "ratingAfter" INTEGER,
  "ratingDelta" INTEGER,

  CONSTRAINT "GameParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE public."PlayerRating" (
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

CREATE UNIQUE INDEX "GameRecord_gameSessionId_key"
  ON public."GameRecord" ("gameSessionId");

CREATE UNIQUE INDEX "GameRecord_matchId_key"
  ON public."GameRecord" ("matchId");

CREATE INDEX "GameRecord_endedAt_idx"
  ON public."GameRecord" ("endedAt");

CREATE INDEX "GameRecord_variantId_idx"
  ON public."GameRecord" ("variantId");

CREATE INDEX "GameParticipant_userId_idx"
  ON public."GameParticipant" ("userId");

CREATE INDEX "GameParticipant_userId_result_idx"
  ON public."GameParticipant" ("userId", "result");

CREATE UNIQUE INDEX "GameParticipant_gameRecordId_userId_key"
  ON public."GameParticipant" ("gameRecordId", "userId");

CREATE INDEX "PlayerRating_variantId_rating_idx"
  ON public."PlayerRating" ("variantId", "rating");

CREATE UNIQUE INDEX "PlayerRating_userId_variantId_key"
  ON public."PlayerRating" ("userId", "variantId");

ALTER TABLE public."GameParticipant"
  ADD CONSTRAINT "GameParticipant_gameRecordId_fkey"
  FOREIGN KEY ("gameRecordId") REFERENCES public."GameRecord" ("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."GameParticipant"
  ADD CONSTRAINT "GameParticipant_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public."User" ("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."PlayerRating"
  ADD CONSTRAINT "PlayerRating_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public."User" ("id")
  ON UPDATE CASCADE ON DELETE CASCADE;
