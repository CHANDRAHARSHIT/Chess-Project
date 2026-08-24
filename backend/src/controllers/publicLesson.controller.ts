import type { Request, Response, NextFunction } from "express";
import { prisma } from "../core/database/prisma.js";

/**
 * GET /api/public-lessons
 * Get all published lessons for public browsing
 */
export async function getPublishedLessons(_req: Request, res: Response, next: NextFunction) {
  try {
    const lessons = await prisma.builderLesson.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        authorDisplayName: true,
        status: true,
        category: true,
        coverImage: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        segments: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            order: true,
            description: true,
            slides: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, fen: true },
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

/**
 * GET /api/public-lessons/:id
 * Get details of a single published lesson by ID or slug for the Interactive Lesson Viewer
 */
export async function getPublishedLessonById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const lesson = await prisma.builderLesson.findFirst({
      where: {
        status: "PUBLISHED",
        OR: [{ id }, { slug: id }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        authorDisplayName: true,
        status: true,
        category: true,
        coverImage: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        segments: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            lessonId: true,
            title: true,
            order: true,
            description: true,
            slides: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                segmentId: true,
                order: true,
                title: true,
                coachText: true,
                fen: true,
                annotations: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ status: "fail", message: "Published lesson not found" });
    }

    res.json({ status: "success", data: lesson });
  } catch (error) {
    next(error);
  }
}
