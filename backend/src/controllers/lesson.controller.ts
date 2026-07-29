import type { Request, Response, NextFunction } from "express";
import { LessonService } from "../services/lesson.service.js";
import { prisma } from "../config/prisma.js";

export class LessonController {
  static async getCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const courses = await LessonService.getCourses();
      res.status(200).json({ status: "success", data: { courses } });
    } catch (error) {
      next(error);
    }
  }

  static async getLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const lesson = await LessonService.getLessonBySlug(slug);
      if (!lesson) {
        return res.status(404).json({ status: "fail", message: "Lesson not found" });
      }
      res.status(200).json({ status: "success", data: { lesson } });
    } catch (error) {
      next(error);
    }
  }

  static async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { lessonId } = req.params;
      const { currentStep, timeSpent, mistakes } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ status: "fail", message: "Unauthorized" });
      }

      await LessonService.updateProgress(userId, lessonId, currentStep, timeSpent, mistakes);
      res.status(200).json({ status: "success", message: "Progress updated" });
    } catch (error) {
      next(error);
    }
  }

  static async completeLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const { lessonId } = req.params;
      const { xp, accuracy, timeSpent, mistakes } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ status: "fail", message: "Unauthorized" });
      }

      await LessonService.completeLesson(userId, lessonId, xp, accuracy, timeSpent, mistakes);
      res.status(200).json({ status: "success", message: "Lesson completed" });
    } catch (error) {
      next(error);
    }
  }

  static async validateMove(req: Request, res: Response, next: NextFunction) {
    try {
      const { lessonId } = req.params;
      const { stepId, uci } = req.body;
      
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (!lesson) {
        return res.status(404).json({ status: "fail", message: "Lesson not found" });
      }

      const content = lesson.content as any;
      const step = content?.steps?.find((s: any) => s.id === stepId);

      if (!step || step.type !== 'BOARD') {
        return res.status(400).json({ status: "fail", message: "Invalid step" });
      }

      const expectedMoves = step.expectedMoves || [];
      const isCorrect = expectedMoves.includes(uci);

      res.status(200).json({
        status: "success",
        data: {
          isCorrect,
          message: isCorrect ? step.successMessage : step.failureMessage
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
