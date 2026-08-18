import type { BuilderLessonData } from "./builderLesson.service";

export interface PendingSyncItem {
  id?: number;
  lessonId: string;
  itemType: "lesson" | "segment" | "slide";
  itemId: string;
  segmentId?: string;
  action: "UPDATE" | "CREATE" | "DELETE";
  payload: any;
  timestamp: number;
}

class LessonCacheService {
  private dbName = "XLChess_LessonDB";
  private dbVersion = 1;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("lessons")) {
          db.createObjectStore("lessons", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("pending_sync")) {
          const syncStore = db.createObjectStore("pending_sync", {
            keyPath: "id",
            autoIncrement: true,
          });
          syncStore.createIndex("lessonId", "lessonId", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Save lesson tree locally in IndexedDB
   */
  async saveLessonLocal(lesson: BuilderLessonData, hasUnsyncedChanges: boolean = true): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction("lessons", "readwrite");
      const store = tx.objectStore("lessons");
      
      const record = {
        ...lesson,
        _localTimestamp: Date.now(),
        _hasUnsyncedChanges: hasUnsyncedChanges,
      };

      store.put(record);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("IndexedDB save error", error);
    }
  }

  /**
   * Get cached lesson tree from IndexedDB
   */
  async getLessonLocal(lessonId: string): Promise<(BuilderLessonData & { _hasUnsyncedChanges?: boolean; _localTimestamp?: number }) | null> {
    try {
      const db = await this.getDB();
      const tx = db.transaction("lessons", "readonly");
      const store = tx.objectStore("lessons");
      const req = store.get(lessonId);

      return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      console.error("IndexedDB get error", error);
      return null;
    }
  }

  /**
   * Add a dirty mutation to the pending sync queue
   */
  async addPendingSync(item: Omit<PendingSyncItem, "id" | "timestamp">): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction("pending_sync", "readwrite");
      const store = tx.objectStore("pending_sync");

      const record: PendingSyncItem = {
        ...item,
        timestamp: Date.now(),
      };

      store.add(record);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("IndexedDB queue add error", error);
    }
  }

  /**
   * Get all pending sync mutations for a lesson (or all lessons)
   */
  async getPendingSyncQueue(lessonId?: string): Promise<PendingSyncItem[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction("pending_sync", "readonly");
      const store = tx.objectStore("pending_sync");
      const req = store.getAll();

      return new Promise((resolve, reject) => {
        req.onsuccess = () => {
          const results: PendingSyncItem[] = req.result || [];
          if (lessonId) {
            resolve(results.filter((i) => i.lessonId === lessonId));
          } else {
            resolve(results);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      console.error("IndexedDB queue get error", error);
      return [];
    }
  }

  /**
   * Remove processed item from queue
   */
  async removePendingSync(id: number): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction("pending_sync", "readwrite");
      const store = tx.objectStore("pending_sync");
      store.delete(id);

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("IndexedDB queue delete error", error);
    }
  }

  /**
   * Mark lesson as completely synced locally
   */
  async markSynced(lessonId: string): Promise<void> {
    try {
      const lesson = await this.getLessonLocal(lessonId);
      if (lesson) {
        await this.saveLessonLocal(lesson, false);
      }
    } catch (error) {
      console.error("IndexedDB markSynced error", error);
    }
  }
}

export const lessonCacheService = new LessonCacheService();
