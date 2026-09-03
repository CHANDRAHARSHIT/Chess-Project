import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

/**
 * GET /api/builder-lessons
 * Get all lessons created by the authenticated user
 */
export async function getLessons(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const lessons = await prisma.builderLesson.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        segments: {
          orderBy: { order: "asc" },
          include: {
            slides: {
              orderBy: { order: "asc" },
              select: { id: true, fen: true, title: true },
            },
          },
        },
      },
    });

    res.json({ status: "success", data: lessons });
  } catch (error) {
    next(error);
  }
}

function getNextUntitledTitle(existingTitles: string[]): string {
  const normalized = existingTitles.map((t) => (t || "").trim().toLowerCase());
  if (!normalized.includes("untitled lesson")) {
    return "Untitled Lesson";
  }
  let counter = 1;
  while (normalized.includes(`untitled lesson (${counter})`)) {
    counter++;
  }
  return `Untitled Lesson (${counter})`;
}

/**
 * POST /api/builder-lessons
 * Create a new blank lesson with default segment & slide
 */
export async function createLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const { title, description, template } = req.body || {};

    let lessonTitle = title;

    if (!lessonTitle) {
      if (template === "t-opening") {
        lessonTitle = "Opening Repertoire";
      } else if (template === "t-tactics") {
        lessonTitle = "Tactical Drill";
      } else if (template === "t-endgame") {
        lessonTitle = "Endgame Mastery";
      } else {
        const userLessons = await prisma.builderLesson.findMany({
          where: { authorId: userId },
          select: { title: true },
        });
        lessonTitle = getNextUntitledTitle(userLessons.map((l) => l.title));
      }
    }

    // Initial default slide content based on template
    let defaultContent = "<h2>Welcome to your new lesson</h2><p>Click anywhere to start editing content, explanations, or notes.</p>";

    if (template === "t-opening") {
      defaultContent = "<h2>Opening Repertoire</h2><p>Analyze opening lines and pawn structures.</p>";
    } else if (template === "t-tactics") {
      defaultContent = "<h2>Tactical Drill</h2><p>Find the best move in this critical position.</p>";
    } else if (template === "t-endgame") {
      defaultContent = "<h2>Endgame Mastery</h2><p>Master essential king and pawn endgames.</p>";
    }

    const lesson = await prisma.builderLesson.create({
      data: {
        title: lessonTitle,
        description,
        authorId: userId,
        authorDisplayName: req.user?.name || "Chess Creator",
        status: "DRAFT",
        segments: {
          create: [
            {
              title: "Segment 1",
              order: 1,
              slides: {
                create: [
                  {
                    order: 1,
                    title: "Slide 1",
                    coachText: defaultContent,
                    fen: "", // Initial slide starts blank without board
                    annotations: {},
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        segments: {
          include: {
            slides: true,
          },
        },
      },
    });

    res.status(201).json({ status: "success", data: lesson });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/builder-lessons/:id
 * Get full lesson details including segments and slides
 */
export async function getLessonById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const lesson = await prisma.builderLesson.findFirst({
      where: { id, authorId: userId },
      include: {
        segments: {
          orderBy: { order: "asc" },
          include: {
            slides: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ status: "fail", message: "Lesson not found" });
    }

    res.json({ status: "success", data: lesson });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/builder-lessons/:id
 * Update lesson title, description, or status
 */
export async function updateLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title, description, status, coverImage, category } = req.body;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const existing = await prisma.builderLesson.findFirst({
      where: { id, authorId: userId },
    });

    if (!existing) {
      return res.status(404).json({ status: "fail", message: "Lesson not found" });
    }

    const updated = await prisma.builderLesson.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(coverImage !== undefined && { coverImage }),
        ...(category !== undefined && { category: category ? String(category) : null }),
        publishedAt: status === "PUBLISHED" ? new Date() : existing.publishedAt,
      },
    });

    res.json({ status: "success", data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/builder-lessons/:id
 * Delete lesson and associated segments/slides
 */
export async function deleteLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const existing = await prisma.builderLesson.findFirst({
      where: { id, authorId: userId },
    });

    if (!existing) {
      return res.status(404).json({ status: "fail", message: "Lesson not found" });
    }

    await prisma.builderLesson.delete({
      where: { id },
    });

    res.json({ status: "success", message: "Lesson deleted successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/builder-lessons/:id/segments
 * Add segment to lesson
 */
export async function createSegment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id: lessonId } = req.params;
    const { title = "New Segment" } = req.body;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const lesson = await prisma.builderLesson.findFirst({
      where: { id: lessonId, authorId: userId },
      include: { segments: true },
    });

    if (!lesson) {
      return res.status(404).json({ status: "fail", message: "Lesson not found" });
    }

    const maxOrder = lesson.segments.reduce((max, s) => Math.max(max, s.order || 0), 0);
    const nextOrder = maxOrder + 1;

    const segment = await prisma.builderSegment.create({
      data: {
        lessonId,
        title,
        order: nextOrder,
        slides: {
          create: [
            {
              order: 1,
              title: "New Slide",
              coachText: "",
              fen: "", // Empty string: new segment slides do NOT contain a chessboard by default
              annotations: {},
            },
          ],
        },
      },
      include: { slides: true },
    });

    res.status(201).json({ status: "success", data: segment });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/builder-lessons/:id/segments/:segmentId
 * Update/rename segment
 */
export async function updateSegment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id: lessonId, segmentId } = req.params;
    const { title } = req.body;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const segment = await prisma.builderSegment.findFirst({
      where: { id: segmentId, lessonId, lesson: { authorId: userId } },
    });

    if (!segment) {
      return res.status(404).json({ status: "fail", message: "Segment not found" });
    }

    const updated = await prisma.builderSegment.update({
      where: { id: segmentId },
      data: { title },
    });

    res.json({ status: "success", data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/builder-lessons/:id/segments/:segmentId
 * Delete segment
 */
export async function deleteSegment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id: lessonId, segmentId } = req.params;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const segment = await prisma.builderSegment.findFirst({
      where: { id: segmentId, lessonId, lesson: { authorId: userId } },
    });

    if (!segment) {
      return res.json({ status: "success", message: "Segment already deleted or not found" });
    }

    await prisma.builderSegment.delete({
      where: { id: segmentId },
    });

    res.json({ status: "success", message: "Segment deleted successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/builder-lessons/:id/segments/:segmentId/slides
 * Add or duplicate slide
 */
export async function createSlide(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id: lessonId, segmentId } = req.params;
    const { title = "New Slide", coachText = "", fen, annotations = {}, duplicateFromSlideId } = req.body;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const segment = await prisma.builderSegment.findFirst({
      where: { id: segmentId, lessonId, lesson: { authorId: userId } },
      include: { slides: true },
    });

    if (!segment) {
      return res.status(404).json({ status: "fail", message: "Segment not found" });
    }

    let slideTitle = title;
    let slideCoachText = coachText;
    let slideFen = fen !== undefined ? fen : "";
    let slideAnnotations = annotations;

    if (duplicateFromSlideId) {
      const sourceSlide = segment.slides.find((s) => s.id === duplicateFromSlideId);
      if (sourceSlide) {
        slideTitle = `${sourceSlide.title || "Slide"} (Copy)`;
        slideCoachText = sourceSlide.coachText;
        slideFen = sourceSlide.fen;
        slideAnnotations = sourceSlide.annotations || {};
      }
    }

    const maxOrder = segment.slides.reduce((max, s) => Math.max(max, s.order || 0), 0);
    const nextOrder = maxOrder + 1;

    const slide = await prisma.builderSlide.create({
      data: {
        segmentId,
        order: nextOrder,
        title: slideTitle,
        coachText: slideCoachText,
        fen: slideFen,
        annotations: slideAnnotations,
      },
    });

    res.status(201).json({ status: "success", data: slide });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/builder-lessons/:id/slides/:slideId
 * Update slide coachText, fen, annotations, title
 */
export async function updateSlide(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id: lessonId, slideId } = req.params;
    const { title, coachText, fen, annotations } = req.body;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const slide = await prisma.builderSlide.findFirst({
      where: { id: slideId, segment: { lessonId, lesson: { authorId: userId } } },
    });

    if (!slide) {
      return res.status(404).json({ status: "fail", message: "Slide not found" });
    }

    const updated = await prisma.builderSlide.update({
      where: { id: slideId },
      data: {
        ...(title !== undefined && { title }),
        ...(coachText !== undefined && { coachText }),
        ...(fen !== undefined && { fen }),
        ...(annotations !== undefined && { annotations }),
      },
    });

    // Touch parent lesson updatedAt
    await prisma.builderLesson.update({
      where: { id: lessonId },
      data: { updatedAt: new Date() },
    });

    res.json({ status: "success", data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/builder-lessons/:id/slides/:slideId
 * Delete slide
 */
export async function deleteSlide(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id: lessonId, slideId } = req.params;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const slide = await prisma.builderSlide.findFirst({
      where: { id: slideId, segment: { lessonId, lesson: { authorId: userId } } },
    });

    if (!slide) {
      return res.json({ status: "success", message: "Slide already deleted or not found" });
    }

    await prisma.builderSlide.delete({
      where: { id: slideId },
    });

    res.json({ status: "success", message: "Slide deleted successfully" });
  } catch (error) {
    next(error);
  }
}
