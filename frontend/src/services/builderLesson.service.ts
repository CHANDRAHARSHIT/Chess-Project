export interface BuilderSlideData {
  id: string;
  segmentId: string;
  order: number;
  title?: string | null;
  coachText: string;
  fen: string;
  annotations?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface BuilderSegmentData {
  id: string;
  lessonId: string;
  title: string;
  order: number;
  description?: string | null;
  slides: BuilderSlideData[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BuilderLessonData {
  id: string;
  title: string;
  description?: string | null;
  authorId: string;
  authorDisplayName?: string | null;
  status: "DRAFT" | "PUBLISHED";
  category?: string | null;
  coverImage?: string | null;
  slug?: string | null;
  segments: BuilderSegmentData[];
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
}

class BuilderLessonService {
  /**
   * Fetch all lessons for logged-in user
   */
  async getLessons(): Promise<BuilderLessonData[]> {
    const res = await fetch("/api/builder-lessons", {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error("Failed to fetch lessons");
    }
    const json = await res.json();
    return json.data || [];
  }

  /**
   * Create a new blank lesson or template lesson
   */
  async createLesson(title?: string, template?: string): Promise<BuilderLessonData> {
    const res = await fetch("/api/builder-lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, template }),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error("Failed to create lesson");
    }
    const json = await res.json();
    return json.data;
  }

  /**
   * Get single lesson by ID with segments and slides
   */
  async getLessonById(id: string): Promise<BuilderLessonData> {
    const res = await fetch(`/api/builder-lessons/${id}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      if (res.status === 404) throw new Error("NOT_FOUND");
      throw new Error("Failed to load lesson");
    }
    const json = await res.json();
    return json.data;
  }

  /**
   * Update lesson metadata (title, description, status)
   */
  async updateLesson(id: string, updates: Partial<BuilderLessonData>): Promise<BuilderLessonData> {
    const res = await fetch(`/api/builder-lessons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update lesson");
    const json = await res.json();
    return json.data;
  }

  /**
   * Publish lesson
   */
  async publishLesson(id: string): Promise<BuilderLessonData> {
    return this.updateLesson(id, { status: "PUBLISHED" });
  }

  /**
   * Delete lesson
   */
  async deleteLesson(id: string): Promise<void> {
    const res = await fetch(`/api/builder-lessons/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete lesson");
  }

  /**
   * Add new segment to lesson
   */
  async createSegment(lessonId: string, title?: string): Promise<BuilderSegmentData> {
    const res = await fetch(`/api/builder-lessons/${lessonId}/segments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to create segment");
    const json = await res.json();
    return json.data;
  }

  /**
   * Update segment title
   */
  async updateSegment(lessonId: string, segmentId: string, title: string): Promise<BuilderSegmentData> {
    const res = await fetch(`/api/builder-lessons/${lessonId}/segments/${segmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to update segment");
    const json = await res.json();
    return json.data;
  }

  /**
   * Delete segment
   */
  async deleteSegment(lessonId: string, segmentId: string): Promise<void> {
    const res = await fetch(`/api/builder-lessons/${lessonId}/segments/${segmentId}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 404) throw new Error("Failed to delete segment");
  }

  /**
   * Create or duplicate slide in segment
   */
  async createSlide(
    lessonId: string,
    segmentId: string,
    slideData?: { title?: string; coachText?: string; fen?: string; duplicateFromSlideId?: string }
  ): Promise<BuilderSlideData> {
    const res = await fetch(`/api/builder-lessons/${lessonId}/segments/${segmentId}/slides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slideData || {}),
    });
    if (!res.ok) throw new Error("Failed to create slide");
    const json = await res.json();
    return json.data;
  }

  /**
   * Update slide content (coachText, fen, annotations, title)
   */
  async updateSlide(
    lessonId: string,
    slideId: string,
    updates: Partial<BuilderSlideData>
  ): Promise<BuilderSlideData> {
    const res = await fetch(`/api/builder-lessons/${lessonId}/slides/${slideId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok && res.status !== 404) throw new Error("Failed to update slide");
    const json = await res.json();
    return json.data;
  }

  /**
   * Delete slide
   */
  async deleteSlide(lessonId: string, slideId: string): Promise<void> {
    const res = await fetch(`/api/builder-lessons/${lessonId}/slides/${slideId}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 404) throw new Error("Failed to delete slide");
  }
}

export const builderLessonService = new BuilderLessonService();
