import type { BuilderLessonData } from "@/services/lessons-builderLesson.service";

class PublicLessonService {
  /**
   * Fetch all public published lessons
   */
  async getPublishedLessons(): Promise<BuilderLessonData[]> {
    const res = await fetch("/api/public-lessons");
    if (!res.ok) {
      throw new Error("Failed to fetch public published lessons");
    }
    const json = await res.json();
    return json.data || [];
  }

  /**
   * Fetch single published lesson by ID or slug for Interactive Lesson Viewer
   */
  async getPublishedLessonById(id: string): Promise<BuilderLessonData> {
    const res = await fetch(`/api/public-lessons/${id}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("NOT_FOUND");
      throw new Error("Failed to fetch lesson");
    }
    const json = await res.json();
    return json.data;
  }
}

export const publicLessonService = new PublicLessonService();

