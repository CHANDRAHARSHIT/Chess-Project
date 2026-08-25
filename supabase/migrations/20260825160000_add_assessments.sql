-- Migration: add_assessments
-- Adds AssessmentTemplate (versioned, frozen question sets per track) and
-- AssessmentAttempt (one row per user per track — no reattempts for now)
-- for the Join Us candidate assessment feature.

CREATE TYPE public."AssessmentAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');
CREATE TYPE public."AssessmentResult" AS ENUM ('PENDING', 'PASS', 'FAIL', 'REVIEW');

CREATE TABLE public."AssessmentTemplate" (
  id             text                           NOT NULL,
  "trackSlug"    text                           NOT NULL,
  version        integer                        NOT NULL,
  "isActive"     boolean                        DEFAULT true NOT NULL,
  data           jsonb                          NOT NULL,
  "gradingRules" jsonb,
  "createdAt"    timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public."AssessmentAttempt" (
  id                text                              NOT NULL,
  "userId"          text                              NOT NULL,
  "trackSlug"       text                              NOT NULL,
  "templateId"      text                              NOT NULL,
  status            public."AssessmentAttemptStatus"  DEFAULT 'IN_PROGRESS' NOT NULL,
  result            public."AssessmentResult"         DEFAULT 'PENDING' NOT NULL,
  "lastAccessedAt"  timestamp(3) without time zone   DEFAULT CURRENT_TIMESTAMP NOT NULL,
  answers           jsonb                             DEFAULT '{}' NOT NULL,
  "radioValues"     jsonb                             DEFAULT '{}' NOT NULL,
  "textValues"      jsonb                             DEFAULT '{}' NOT NULL,
  bookmarks         integer[]                         DEFAULT ARRAY[]::integer[],
  "estimateMinutes" integer,
  "timedSectionStartedAt" timestamp(3) without time zone,
  "timedDeadlineAt" timestamp(3) without time zone,
  "extensionUsed"   boolean                           DEFAULT false NOT NULL,
  "wrongCount"      integer,
  "submittedAt"     timestamp(3) without time zone,
  "createdAt"       timestamp(3) without time zone    DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"       timestamp(3) without time zone     NOT NULL
);

ALTER TABLE public."AssessmentTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AssessmentAttempt" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."AssessmentTemplate"
  ADD CONSTRAINT "AssessmentTemplate_pkey" PRIMARY KEY (id);

ALTER TABLE public."AssessmentAttempt"
  ADD CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY (id);

ALTER TABLE public."AssessmentAttempt"
  ADD CONSTRAINT "AssessmentAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public."User"(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."AssessmentAttempt"
  ADD CONSTRAINT "AssessmentAttempt_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES public."AssessmentTemplate"(id)
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE UNIQUE INDEX "AssessmentTemplate_trackSlug_version_key" ON public."AssessmentTemplate" ("trackSlug", version);
CREATE INDEX "AssessmentTemplate_trackSlug_isActive_idx" ON public."AssessmentTemplate" ("trackSlug", "isActive");

CREATE UNIQUE INDEX "AssessmentAttempt_userId_trackSlug_key" ON public."AssessmentAttempt" ("userId", "trackSlug");
CREATE INDEX "AssessmentAttempt_trackSlug_idx" ON public."AssessmentAttempt" ("trackSlug");

GRANT ALL ON public."AssessmentTemplate" TO anon;
GRANT ALL ON public."AssessmentTemplate" TO authenticated;
GRANT ALL ON public."AssessmentTemplate" TO service_role;

GRANT ALL ON public."AssessmentAttempt" TO anon;
GRANT ALL ON public."AssessmentAttempt" TO authenticated;
GRANT ALL ON public."AssessmentAttempt" TO service_role;
