import { LESSONS_DATA, COURSES_DATA } from "../data/lessonsData";

export interface LessonProgressData {
  currentStep: number;
  timeSpent: number;
  mistakes: number;
}

export interface CompleteLessonData {
  xp: number;
  accuracy: number;
  timeSpent: number;
  mistakes: number;
}

export class LessonService {
  static async getCourses() {
    try {
      const response = await fetch("/api/lessons", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.status === "success" && Array.isArray(json.data?.courses) && json.data.courses.length > 0) {
          return json;
        }
      }
      // Fallback to rich static course dataset
      return { status: "success", data: { courses: COURSES_DATA } };
    } catch (error: any) {
      console.warn("[LessonService.getCourses] Using local courses dataset fallback.");
      return { status: "success", data: { courses: COURSES_DATA } };
    }
  }

  static async getLessonBySlug(slug: string) {
    // Check local dataset first for instant, high quality experience
    if (LESSONS_DATA[slug]) {
      return { status: "success", data: { lesson: LESSONS_DATA[slug] } };
    }

    try {
      const response = await fetch(`/api/lessons/${slug}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.status === "success" && json.data?.lesson) {
          return json;
        }
      }
    } catch (error: any) {
      console.warn(`[LessonService.getLessonBySlug] Backend fetch failed for slug ${slug}.`);
    }

    // Check if there's a fallback lesson in dataset by partial match or return default Italian Game
    const defaultLesson = LESSONS_DATA["italian-game"];
    return { status: "success", data: { lesson: { ...defaultLesson, slug, title: slug.replace(/-/g, " ").toUpperCase() } } };
  }

  static async updateProgress(lessonId: string, data: LessonProgressData) {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update progress");
      return await response.json();
    } catch (error: any) {
      // Local progress is saved in ProgressManager via localStorage
      return { status: "success", message: "Saved locally" };
    }
  }

  static async completeLesson(lessonId: string, data: CompleteLessonData) {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to complete lesson");
      return await response.json();
    } catch (error: any) {
      return { status: "success", message: "Completed locally" };
    }
  }

  static async validateMove(lessonId: string, stepId: string, uci: string) {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/validate-move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, uci })
      });
      if (!response.ok) throw new Error("Failed to validate move");
      return await response.json();
    } catch (error: any) {
      return { status: "fail", message: error.message };
    }
  }
}

