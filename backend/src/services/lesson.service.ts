import { prisma } from "../config/prisma.js";

export class LessonService {
  static async getCourses() {
    return await prisma.course.findMany({
      where: { published: true },
      include: {
        lessons: {
          where: { published: true },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            thumbnail: true,
            difficulty: true,
            estimatedTime: true,
            category: true,
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  static async getLessonBySlug(slug: string) {
    return await prisma.lesson.findUnique({
      where: { slug, published: true },
    });
  }

  static async updateProgress(userId: string, lessonId: string, currentStep: number, timeSpent: number, mistakes: number) {
    return await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId }
      },
      update: {
        currentStep,
        timeSpent,
        mistakes
      },
      create: {
        userId,
        lessonId,
        currentStep,
        timeSpent,
        mistakes
      }
    });
  }

  static async completeLesson(userId: string, lessonId: string, xp: number, accuracy: number, timeSpent: number, mistakes: number) {
    return await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId }
      },
      update: {
        completed: true,
        xp,
        accuracy,
        timeSpent,
        mistakes
      },
      create: {
        userId,
        lessonId,
        completed: true,
        xp,
        accuracy,
        timeSpent,
        mistakes
      }
    });
  }
}
