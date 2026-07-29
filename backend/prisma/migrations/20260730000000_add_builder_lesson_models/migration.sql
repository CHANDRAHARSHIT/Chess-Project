-- CreateEnum
CREATE TYPE "BuilderLessonStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "BuilderLesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT NOT NULL,
    "authorDisplayName" TEXT,
    "status" "BuilderLessonStatus" NOT NULL DEFAULT 'DRAFT',
    "coverImage" TEXT,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "BuilderLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderSegment" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderSlide" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT,
    "coachText" TEXT NOT NULL,
    "fen" TEXT NOT NULL,
    "annotations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BuilderLesson_slug_key" ON "BuilderLesson"("slug");
CREATE INDEX "BuilderLesson_authorId_idx" ON "BuilderLesson"("authorId");
CREATE INDEX "BuilderLesson_status_idx" ON "BuilderLesson"("status");
CREATE INDEX "BuilderLesson_slug_idx" ON "BuilderLesson"("slug");

-- CreateIndex
CREATE INDEX "BuilderSegment_lessonId_idx" ON "BuilderSegment"("lessonId");
CREATE UNIQUE INDEX "BuilderSegment_lessonId_order_key" ON "BuilderSegment"("lessonId", "order");

-- CreateIndex
CREATE INDEX "BuilderSlide_segmentId_idx" ON "BuilderSlide"("segmentId");
CREATE UNIQUE INDEX "BuilderSlide_segmentId_order_key" ON "BuilderSlide"("segmentId", "order");

-- AddForeignKey
ALTER TABLE "BuilderLesson" ADD CONSTRAINT "BuilderLesson_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderSegment" ADD CONSTRAINT "BuilderSegment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "BuilderLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderSlide" ADD CONSTRAINT "BuilderSlide_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BuilderSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
