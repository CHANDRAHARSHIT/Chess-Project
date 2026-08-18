-- Drop legacy tables if present from previous experimental builds
DROP TABLE IF EXISTS "LessonProgress" CASCADE;
DROP TABLE IF EXISTS "Lesson" CASCADE;
DROP TABLE IF EXISTS "Course" CASCADE;
DROP TABLE IF EXISTS "CustomLink" CASCADE;
DROP TYPE IF EXISTS "LessonStatus" CASCADE;
DROP TYPE IF EXISTS "OpeningDifficulty" CASCADE;

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT NOT NULL,
    "authorDisplayName" TEXT,
    "status" "LessonStatus" NOT NULL DEFAULT 'DRAFT',
    "coverImage" TEXT,
    "slug" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "priceAmount" INTEGER,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "averageRating" DOUBLE PRECISION,
    "ratingsCount" INTEGER NOT NULL DEFAULT 0,
    "channelId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slide" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT,
    "coachText" TEXT NOT NULL,
    "fen" TEXT NOT NULL,
    "annotations" JSONB NOT NULL,
    "audioUrl" TEXT,
    "audioDuration" INTEGER,
    "videoUrl" TEXT,
    "interactiveData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_slug_key" ON "Lesson"("slug");
CREATE INDEX "Lesson_authorId_idx" ON "Lesson"("authorId");
CREATE INDEX "Lesson_status_idx" ON "Lesson"("status");
CREATE INDEX "Lesson_slug_idx" ON "Lesson"("slug");
CREATE INDEX "Lesson_channelId_idx" ON "Lesson"("channelId");

-- CreateIndex
CREATE INDEX "Segment_lessonId_idx" ON "Segment"("lessonId");
CREATE UNIQUE INDEX "Segment_lessonId_order_key" ON "Segment"("lessonId", "order");

-- CreateIndex
CREATE INDEX "Slide_segmentId_idx" ON "Slide"("segmentId");
CREATE UNIQUE INDEX "Slide_segmentId_order_key" ON "Slide"("segmentId", "order");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slide" ADD CONSTRAINT "Slide_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
