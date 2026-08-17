import { lessonCacheService, type PendingSyncItem } from "./lessonCache.service";
import { builderLessonService } from "./builderLesson.service";

export type SyncState = "saved" | "saving_local" | "syncing" | "offline" | "error";

class LessonSyncService {
  private isSyncing = false;
  private syncListeners: Set<(state: SyncState) => void> = new Set();
  private currentState: SyncState = "saved";

  constructor() {
    this.setupListeners();
  }

  /**
   * Subscribe UI components to save/sync status changes
   */
  subscribeStatus(callback: (state: SyncState) => void) {
    this.syncListeners.add(callback);
    callback(this.currentState);
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  public setSyncState(state: SyncState) {
    this.currentState = state;
    this.syncListeners.forEach((cb) => cb(state));
  }

  public getSyncState(): SyncState {
    return this.currentState;
  }

  /**
   * Start 60-second background sync timer & window online listener
   */
  private setupListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      console.log("[LessonSyncService] Internet restored. Triggering sync...");
      this.processSyncQueue();
    });

    window.addEventListener("offline", () => {
      this.setSyncState("offline");
    });

    // Background sync every 60 seconds
    setInterval(() => {
      if (navigator.onLine) {
        this.processSyncQueue();
      }
    }, 60000);
  }

  /**
   * Process all pending dirty mutations in IndexedDB incrementally
   */
  async processSyncQueue(lessonId?: string): Promise<boolean> {
    if (this.isSyncing) return false;

    if (!navigator.onLine) {
      this.setSyncState("offline");
      return false;
    }

    const queue = await lessonCacheService.getPendingSyncQueue(lessonId);
    if (queue.length === 0) {
      this.setSyncState("saved");
      return true;
    }

    this.isSyncing = true;
    this.setSyncState("syncing");

    let hasErrors = false;

    for (const item of queue) {
      try {
        await this.syncItem(item);
        if (item.id !== undefined) {
          await lessonCacheService.removePendingSync(item.id);
        }
      } catch (error: any) {
        console.error("[LessonSyncService] Item sync error", item, error);
        if (
          error?.message?.includes("404") ||
          error?.message?.includes("not found") ||
          error?.message?.includes("NOT_FOUND") ||
          error?.message?.includes("delete")
        ) {
          if (item.id !== undefined) {
            await lessonCacheService.removePendingSync(item.id);
          }
          continue;
        }
        hasErrors = true;
        break;
      }
    }

    this.isSyncing = false;

    if (hasErrors) {
      this.setSyncState(navigator.onLine ? "error" : "offline");
      return false;
    }

    if (lessonId) {
      await lessonCacheService.markSynced(lessonId);
    }

    this.setSyncState("saved");
    return true;
  }

  /**
   * Execute single incremental HTTP request
   */
  private async syncItem(item: PendingSyncItem): Promise<void> {
    const { lessonId, itemType, itemId, action, payload, segmentId } = item;

    if (itemType === "lesson" && action === "UPDATE") {
      await builderLessonService.updateLesson(lessonId, payload);
    } else if (itemType === "slide" && action === "UPDATE") {
      await builderLessonService.updateSlide(lessonId, itemId, payload);
    } else if (itemType === "slide" && action === "CREATE") {
      if (!segmentId) return;
      await builderLessonService.createSlide(lessonId, segmentId, payload);
    } else if (itemType === "slide" && action === "DELETE") {
      await builderLessonService.deleteSlide(lessonId, itemId);
    } else if (itemType === "segment" && action === "UPDATE") {
      await builderLessonService.updateSegment(lessonId, itemId, payload.title);
    } else if (itemType === "segment" && action === "CREATE") {
      await builderLessonService.createSegment(lessonId, payload.title);
    } else if (itemType === "segment" && action === "DELETE") {
      await builderLessonService.deleteSegment(lessonId, itemId);
    }
  }
}

export const lessonSyncService = new LessonSyncService();
