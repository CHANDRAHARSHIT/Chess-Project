-- CreateEnum
CREATE TYPE "AssessmentAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "AssessmentResult" AS ENUM ('PENDING', 'PASS', 'FAIL', 'REVIEW');

-- CreateTable
CREATE TABLE "AssessmentTemplate" (
    "id" TEXT NOT NULL,
    "trackSlug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL,
    "gradingRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackSlug" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "AssessmentAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "result" "AssessmentResult" NOT NULL DEFAULT 'PENDING',
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "radioValues" JSONB NOT NULL DEFAULT '{}',
    "textValues" JSONB NOT NULL DEFAULT '{}',
    "bookmarks" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "estimateMinutes" INTEGER,
    "timedSectionStartedAt" TIMESTAMP(3),
    "timedDeadlineAt" TIMESTAMP(3),
    "extensionUsed" BOOLEAN NOT NULL DEFAULT false,
    "wrongCount" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentTemplate_trackSlug_version_key" ON "AssessmentTemplate"("trackSlug", "version");

-- CreateIndex
CREATE INDEX "AssessmentTemplate_trackSlug_isActive_idx" ON "AssessmentTemplate"("trackSlug", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_userId_trackSlug_key" ON "AssessmentAttempt"("userId", "trackSlug");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_trackSlug_idx" ON "AssessmentAttempt"("trackSlug");

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AssessmentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
