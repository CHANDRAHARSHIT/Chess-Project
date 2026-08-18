/*
  Warnings:

  - You are about to drop the column `aiPrompt` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `authorDisplayName` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `averageRating` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `channelId` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `coverImage` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `isAiGenerated` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `isPremium` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `priceAmount` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `ratingsCount` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Opening` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Opening` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `Opening` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Opening` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Opening` table. All the data in the column will be lost.
  - You are about to drop the `Segment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Slide` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `content` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseId` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Made the column `slug` on table `Lesson` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `moves` to the `Opening` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Segment" DROP CONSTRAINT "Segment_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Slide" DROP CONSTRAINT "Slide_segmentId_fkey";

-- DropIndex
DROP INDEX "Lesson_authorId_idx";

-- DropIndex
DROP INDEX "Lesson_channelId_idx";

-- DropIndex
DROP INDEX "Lesson_slug_idx";

-- DropIndex
DROP INDEX "Lesson_status_idx";

-- DropIndex
DROP INDEX "Opening_slug_key";

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "aiPrompt",
DROP COLUMN "authorDisplayName",
DROP COLUMN "authorId",
DROP COLUMN "averageRating",
DROP COLUMN "channelId",
DROP COLUMN "coverImage",
DROP COLUMN "isAiGenerated",
DROP COLUMN "isPremium",
DROP COLUMN "metadata",
DROP COLUMN "priceAmount",
DROP COLUMN "publishedAt",
DROP COLUMN "ratingsCount",
DROP COLUMN "status",
DROP COLUMN "version",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "content" JSONB NOT NULL,
ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "estimatedTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "thumbnail" TEXT,
ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Opening" DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "difficulty",
DROP COLUMN "slug",
DROP COLUMN "updatedAt",
ADD COLUMN     "moves" TEXT NOT NULL;

-- DropTable
DROP TABLE "Segment";

-- DropTable
DROP TABLE "Slide";

-- DropEnum
DROP TYPE "LessonStatus";

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "accuracy" DOUBLE PRECISION,
    "mistakes" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "lastClickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON "LessonProgress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "Opening_eco_idx" ON "Opening"("eco");

-- CreateIndex
CREATE INDEX "Opening_name_idx" ON "Opening"("name");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomLink" ADD CONSTRAINT "CustomLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
