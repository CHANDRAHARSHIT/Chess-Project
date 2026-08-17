-- Migration: add_builder_lesson_models
-- Adds BuilderLessonStatus enum and BuilderLesson, BuilderSegment, BuilderSlide tables
-- for the Build Your Own Lessons feature. Purely additive and safe for existing schema.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BuilderLessonStatus') THEN
        CREATE TYPE public."BuilderLessonStatus" AS ENUM ('DRAFT', 'PUBLISHED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public."BuilderLesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT NOT NULL,
    "authorDisplayName" TEXT,
    "status" public."BuilderLessonStatus" NOT NULL DEFAULT 'DRAFT',
    "category" TEXT,
    "coverImage" TEXT,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "BuilderLesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."BuilderSegment" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuilderSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."BuilderSlide" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT,
    "coachText" TEXT NOT NULL,
    "fen" TEXT NOT NULL,
    "annotations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuilderSlide_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "BuilderLesson_slug_key" ON public."BuilderLesson" ("slug");
CREATE INDEX IF NOT EXISTS "BuilderLesson_authorId_idx" ON public."BuilderLesson" ("authorId");
CREATE INDEX IF NOT EXISTS "BuilderLesson_status_idx" ON public."BuilderLesson" ("status");
CREATE INDEX IF NOT EXISTS "BuilderLesson_slug_idx" ON public."BuilderLesson" ("slug");

CREATE INDEX IF NOT EXISTS "BuilderSegment_lessonId_idx" ON public."BuilderSegment" ("lessonId");
CREATE UNIQUE INDEX IF NOT EXISTS "BuilderSegment_lessonId_order_key" ON public."BuilderSegment" ("lessonId", "order");

CREATE INDEX IF NOT EXISTS "BuilderSlide_segmentId_idx" ON public."BuilderSlide" ("segmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "BuilderSlide_segmentId_order_key" ON public."BuilderSlide" ("segmentId", "order");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'BuilderLesson_authorId_fkey'
    ) THEN
        ALTER TABLE public."BuilderLesson"
            ADD CONSTRAINT "BuilderLesson_authorId_fkey"
            FOREIGN KEY ("authorId") REFERENCES public."User"("id")
            ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'BuilderSegment_lessonId_fkey'
    ) THEN
        ALTER TABLE public."BuilderSegment"
            ADD CONSTRAINT "BuilderSegment_lessonId_fkey"
            FOREIGN KEY ("lessonId") REFERENCES public."BuilderLesson"("id")
            ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'BuilderSlide_segmentId_fkey'
    ) THEN
        ALTER TABLE public."BuilderSlide"
            ADD CONSTRAINT "BuilderSlide_segmentId_fkey"
            FOREIGN KEY ("segmentId") REFERENCES public."BuilderSegment"("id")
            ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END $$;

-- Grants
GRANT ALL ON public."BuilderLesson" TO anon, authenticated, service_role;
GRANT ALL ON public."BuilderSegment" TO anon, authenticated, service_role;
GRANT ALL ON public."BuilderSlide" TO anon, authenticated, service_role;
