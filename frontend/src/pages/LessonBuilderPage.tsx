import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { LessonCanvas } from "@/components/lessons-LessonCanvas";
import { LessonBuilderSidebar } from "@/components/lessons-LessonBuilderSidebar";
import { LessonBuilderHeader } from "@/components/lessons-LessonBuilderHeader";
import { LessonTextToolbar } from "@/components/lessons-LessonTextToolbar";
import { LessonFooter } from "@/components/lessons-LessonFooter";
import { PublishConfirmationModal } from "@/components/lessons-PublishConfirmationModal";
import { ContextMenu } from "@/components/lessons-ContextMenu";
import { AuthModal } from "@/components/account-AuthModal";
import type { SlideData, SegmentData } from "@/types/lessons-types";
import {
  builderLessonService,
  type BuilderLessonData,
} from "@/services/lessons-builderLesson.service";
import { lessonCacheService } from "@/services/lessons-lessonCache.service";
import { lessonSyncService, type SyncState } from "@/services/lessons-lessonSync.service";
import { computeLessonSnapshotHash } from "@/utils/lessons-lessonHasher";

export default function LessonBuilderPage() {
  const { id: lessonId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<BuilderLessonData | null>(null);
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<string>("");
  const [activeSlideId, setActiveSlideId] = useState<string>("");
  const [lessonTitle, setLessonTitle] = useState<string>("Untitled Lesson");
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<SyncState>("saved");
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  const [lessonStatus, setLessonStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Deterministic Cloud Hashing References for zero-redundancy autosave & undo/revert detection
  const latestCloudHashRef = useRef<string | null>(null);
  const inFlightSaveHashRef = useRef<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef<boolean>(true);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Subscribe to sync service status changes & check pending queue
  useEffect(() => {
    const unsubscribe = lessonSyncService.subscribeStatus(async (status) => {
      setSaveStatus(status);
      if (status === "saved" && lessonId) {
        const queue = await lessonCacheService.getPendingSyncQueue(lessonId);
        if (queue.length === 0) {
          const currentHash = computeLessonSnapshotHash(lessonTitle, lessonStatus, segments);
          if (latestCloudHashRef.current && currentHash === latestCloudHashRef.current) {
            setHasUnsyncedChanges(false);
          }
        }
      }
    });
    return unsubscribe;
  }, [lessonId, lessonTitle, lessonStatus, segments]);

  // Instant Change & Undo/Revert Detection Effect
  useEffect(() => {
    if (isInitialMount.current || !latestCloudHashRef.current) return;
    const currentHash = computeLessonSnapshotHash(lessonTitle, lessonStatus, segments);
    if (currentHash === latestCloudHashRef.current) {
      setHasUnsyncedChanges(false);
    } else {
      setHasUnsyncedChanges(true);
    }
  }, [lessonTitle, lessonStatus, segments]);

  // Load lesson data (IndexedDB first, then server reconciliation)
  useEffect(() => {
    if (lessonId) {
      loadLessonData(lessonId);
    } else {
      setLoading(false);
    }
  }, [lessonId]);

  const loadLessonData = async (id: string) => {
    setLoading(true);
    try {
      // 1. Try restoring from IndexedDB cache first
      const cached = await lessonCacheService.getLessonLocal(id);
      if (cached) {
        applyLessonDataToState(cached);
      }

      // 2. Fetch server version if online
      if (navigator.onLine) {
        try {
          const serverData = await builderLessonService.getLessonById(id);
          const serverMappedSegments: SegmentData[] = (serverData.segments || []).map((seg) => ({
            id: seg.id,
            title: seg.title,
            isExpanded: true,
            slides: (seg.slides || []).map((sl) => ({
              id: sl.id,
              title: sl.title || "Slide",
              content: sl.coachText || "",
              hasBoard: Boolean(sl.fen && sl.fen.trim() !== ""),
              fen: sl.fen || "",
              annotations: sl.annotations || {},
            })),
          }));

          const serverHash = computeLessonSnapshotHash(
            serverData.title || "Untitled Lesson",
            serverData.status || "DRAFT",
            serverMappedSegments
          );
          latestCloudHashRef.current = serverHash;

          // If local version had no unsynced changes, update state with server version
          if (!cached || !cached._hasUnsyncedChanges) {
            applyLessonDataToState(serverData);
            await lessonCacheService.saveLessonLocal(serverData, false);
            setHasUnsyncedChanges(false);
          } else {
            // Reconcile pending queue with server
            const currentHash = computeLessonSnapshotHash(
              cached.title || "Untitled Lesson",
              cached.status || "DRAFT",
              (cached.segments || []).map((seg) => ({
                id: seg.id,
                title: seg.title,
                isExpanded: true,
                slides: (seg.slides || []).map((sl) => ({
                  id: sl.id,
                  title: sl.title || "Slide",
                  content: sl.coachText || "",
                  hasBoard: Boolean(sl.fen && sl.fen.trim() !== ""),
                  fen: sl.fen || "",
                  annotations: sl.annotations || {},
                })),
              }))
            );

            if (currentHash === serverHash) {
              setHasUnsyncedChanges(false);
            } else {
              setHasUnsyncedChanges(true);
              performCloudSync();
            }
          }
        } catch (serverErr: any) {
          if (serverErr?.message === "UNAUTHORIZED") {
            setAuthModalOpen(true);
          }
        }
      }
    } catch (err: any) {
      console.error("Error loading lesson data", err);
    } finally {
      setLoading(false);
      isInitialMount.current = true;
    }
  };

  const applyLessonDataToState = (data: BuilderLessonData) => {
    setLesson(data);
    setLessonTitle(data.title || "Untitled Lesson");
    setLessonStatus(data.status || "DRAFT");
    setPublishedAt(data.publishedAt || null);

    const mappedSegments: SegmentData[] = (data.segments || []).map((seg) => ({
      id: seg.id,
      title: seg.title,
      isExpanded: true,
      slides: (seg.slides || []).map((sl) => ({
        id: sl.id,
        title: sl.title || "Slide",
        content: sl.coachText || "",
        hasBoard: Boolean(sl.fen && sl.fen.trim() !== ""),
        fen: sl.fen || "",
        annotations: sl.annotations || {},
      })),
    }));

    setSegments(mappedSegments);
    if (mappedSegments.length > 0) {
      setActiveSegmentId(mappedSegments[0].id);
      if (mappedSegments[0].slides.length > 0) {
        setActiveSlideId(mappedSegments[0].slides[0].id);
      }
    }
  };

  // Find active slide data
  const activeSegment = segments.find((s) => s.id === activeSegmentId);
  const activeSlide = activeSegment?.slides.find((sl) => sl.id === activeSlideId);

  const flushPendingChanges = async () => {
    if (!lessonId) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const updatedTree: BuilderLessonData = {
      id: lessonId,
      title: lessonTitle,
      authorId: lesson?.authorId || "",
      status: lessonStatus,
      segments: segments.map((seg) => ({
        id: seg.id,
        lessonId,
        title: seg.title,
        order: 1,
        slides: seg.slides.map((sl, idx) => ({
          id: sl.id,
          segmentId: seg.id,
          order: idx + 1,
          title: sl.title,
          coachText: sl.content,
          fen: sl.hasBoard ? sl.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : "",
          annotations: sl.annotations || {},
        })),
      })),
    };

    await lessonCacheService.saveLessonLocal(updatedTree, true);

    if (activeSlide) {
      await lessonCacheService.addPendingSync({
        lessonId,
        itemType: "slide",
        itemId: activeSlide.id,
        action: "UPDATE",
        payload: {
          title: activeSlide.title,
          coachText: activeSlide.content,
          fen: activeSlide.hasBoard ? activeSlide.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : "",
          annotations: activeSlide.annotations || {},
        },
      });
    }
  };

  /**
   * Optimized Cloud Sync Execution.
   * Compares the deterministic snapshot hash of current lesson data against latestCloudHash.
   * If hashes match, BYPASSES database network requests completely.
   */
  const performCloudSync = async (): Promise<boolean> => {
    if (!lessonId || !navigator.onLine) {
      lessonSyncService.setSyncState("offline");
      return false;
    }

    const currentHash = computeLessonSnapshotHash(lessonTitle, lessonStatus, segments);

    // Rule 5: If current content matches latest cloud hash, DO NOT make a network request!
    if (latestCloudHashRef.current && currentHash === latestCloudHashRef.current) {
      setHasUnsyncedChanges(false);
      lessonSyncService.setSyncState("saved");
      return true;
    }

    // Record the snapshot hash being sent in this request
    inFlightSaveHashRef.current = currentHash;

    const success = await lessonSyncService.processSyncQueue(lessonId);

    if (success && inFlightSaveHashRef.current) {
      // Update cloudHash ONLY after request succeeds!
      latestCloudHashRef.current = inFlightSaveHashRef.current;

      // Handle race condition: check if user made newer edits while request was in-flight
      const postSaveHash = computeLessonSnapshotHash(lessonTitle, lessonStatus, segments);
      if (postSaveHash === latestCloudHashRef.current) {
        setHasUnsyncedChanges(false);
      } else {
        setHasUnsyncedChanges(true);
      }
      return true;
    }

    return false;
  };

  // Manual Force Cloud Sync Handler
  const handleForceCloudSync = async () => {
    if (!lessonId) return;
    try {
      const currentHash = computeLessonSnapshotHash(lessonTitle, lessonStatus, segments);
      if (latestCloudHashRef.current && currentHash === latestCloudHashRef.current) {
        setHasUnsyncedChanges(false);
        showToast("Lesson is already synced to cloud storage!", "success");
        return;
      }

      // Flush local changes first
      await flushPendingChanges();

      // Perform optimized cloud sync
      const success = await performCloudSync();

      if (success) {
        showToast("Lesson synced to cloud storage!", "success");
      } else {
        showToast("Cloud sync failed. Changes remain saved locally.", "error");
      }
    } catch (err: any) {
      console.error("Force cloud sync error", err);
      showToast(err?.message || "Cloud sync failed. Changes remain saved locally.", "error");
    }
  };

  const handlePublishLesson = async () => {
    if (!lessonId) return;
    setIsPublishing(true);
    try {
      // 1. Flush any pending local / editor changes to database
      await flushPendingChanges();

      // 2. Call backend endpoint to set status to PUBLISHED
      const updated = await builderLessonService.updateLesson(lessonId, { status: "PUBLISHED" });

      // 3. Update local state and IndexedDB cache
      const newStatus = updated.status || "PUBLISHED";
      const newPubAt = updated.publishedAt || new Date().toISOString();
      setLessonStatus(newStatus);
      setPublishedAt(newPubAt);

      const postPublishHash = computeLessonSnapshotHash(lessonTitle, newStatus, segments);
      latestCloudHashRef.current = postPublishHash;
      setHasUnsyncedChanges(false);

      if (lesson) {
        setLesson({ ...lesson, status: newStatus, publishedAt: newPubAt });
      }

      await lessonCacheService.saveLessonLocal(
        {
          ...(lesson || {}),
          id: lessonId,
          title: lessonTitle,
          authorId: lesson?.authorId || "",
          status: newStatus,
          publishedAt: newPubAt,
          segments: segments.map((seg) => ({
            id: seg.id,
            lessonId,
            title: seg.title,
            order: 1,
            slides: seg.slides.map((sl, idx) => ({
              id: sl.id,
              segmentId: seg.id,
              order: idx + 1,
              title: sl.title,
              coachText: sl.content,
              fen: sl.hasBoard ? sl.fen || "" : "",
              annotations: sl.annotations || {},
            })),
          })),
        },
        false
      );

      // 4. Show success toast feedback
      showToast(
        lessonStatus === "PUBLISHED"
          ? "Lesson republished successfully!"
          : "Lesson published successfully!",
        "success"
      );
      setPublishModalOpen(false);
    } catch (err: any) {
      console.error("Failed to publish lesson", err);
      showToast(err?.message || "Failed to publish lesson. Please try again.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveAsDraftAndExit = async () => {
    if (!lessonId) return;
    setIsSavingDraft(true);
    try {
      // 1. Flush any pending local / editor changes
      await flushPendingChanges();

      // 2. Process sync queue to database if online
      if (navigator.onLine) {
        await performCloudSync();
      }

      setPublishModalOpen(false);
      // 3. Navigate back to Lesson Builder dashboard
      navigate("/lessons");
    } catch (err: any) {
      console.error("Failed to save draft", err);
      showToast(err?.message || "Failed to save draft. Please try again.", "error");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Debounced Local Save (IndexedDB) & Optimized Background Cloud Sync
  const triggerAutoSave = (dirtySlideId?: string, dirtySegmentId?: string) => {
    if (!lessonId || isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Instant local save indicator
    lessonSyncService.setSyncState("saving_local");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        // Construct updated lesson tree
        const updatedTree: BuilderLessonData = {
          id: lessonId,
          title: lessonTitle,
          authorId: lesson?.authorId || "",
          status: lessonStatus,
          segments: segments.map((seg) => ({
            id: seg.id,
            lessonId,
            title: seg.title,
            order: 1,
            slides: seg.slides.map((sl, idx) => ({
              id: sl.id,
              segmentId: seg.id,
              order: idx + 1,
              title: sl.title,
              coachText: sl.content,
              fen: sl.hasBoard ? sl.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : "",
              annotations: sl.annotations || {},
            })),
          })),
        };

        // 1. Fast local persistence to IndexedDB
        await lessonCacheService.saveLessonLocal(updatedTree, true);

        // 2. Queue dirty mutation
        const targetSlide = dirtySlideId ? activeSlide : undefined;
        if (targetSlide) {
          await lessonCacheService.addPendingSync({
            lessonId,
            itemType: "slide",
            itemId: targetSlide.id,
            action: "UPDATE",
            payload: {
              title: targetSlide.title,
              coachText: targetSlide.content,
              fen: targetSlide.hasBoard ? targetSlide.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : "",
              annotations: targetSlide.annotations || {},
            },
          });
        } else if (dirtySegmentId) {
          const targetSeg = segments.find((s) => s.id === dirtySegmentId);
          if (targetSeg) {
            await lessonCacheService.addPendingSync({
              lessonId,
              itemType: "segment",
              itemId: dirtySegmentId,
              action: "UPDATE",
              payload: { title: targetSeg.title },
            });
          }
        } else {
          // General lesson title update
          await lessonCacheService.addPendingSync({
            lessonId,
            itemType: "lesson",
            itemId: lessonId,
            action: "UPDATE",
            payload: { title: lessonTitle },
          });
        }

        // 3. Perform zero-redundancy cloud sync check
        await performCloudSync();
      } catch (error) {
        console.error("Local save error", error);
        lessonSyncService.setSyncState("error");
      }
    }, 3000);
  };

  // Select Slide Handler
  const handleSelectSlide = (slideId: string, segId: string) => {
    if (activeSlideId !== slideId) {
      setActiveSlideId(slideId);
      setActiveSegmentId(segId);
      if (lessonId && navigator.onLine) {
        performCloudSync();
      }
    }
  };

  // Helper to update active slide properties
  const updateActiveSlide = (updates: Partial<SlideData>) => {
    setSegments(
      segments.map((seg) => {
        if (seg.id === activeSegmentId) {
          return {
            ...seg,
            slides: seg.slides.map((sl) =>
              sl.id === activeSlideId ? { ...sl, ...updates } : sl
            ),
          };
        }
        return seg;
      })
    );

    triggerAutoSave(activeSlideId);
  };

  const handleTitleChange = (newTitle: string) => {
    setLessonTitle(newTitle);
    triggerAutoSave();
  };

  // Exec formatting command on document editor
  const formatDocument = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    triggerAutoSave(activeSlideId);
  };

  const globalSavedRangeRef = useRef<Range | null>(null);
  const [hasTextSelection, setHasTextSelection] = useState<boolean>(false);
  const [existingLinkUrl, setExistingLinkUrl] = useState<string>("");
  const [linkPopoverOpen, setLinkPopoverOpen] = useState<boolean>(false);

  const saveCurrentSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const activeEditor = document.querySelector('[contenteditable="true"]');
      if (activeEditor && activeEditor.contains(sel.anchorNode)) {
        if (!sel.isCollapsed) {
          globalSavedRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
      }
    }
  };

  const restoreSelection = () => {
    if (globalSavedRangeRef.current && typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(globalSavedRangeRef.current);
      }
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      if (typeof window === "undefined") return;
      const sel = window.getSelection();
      const activeEditor = document.querySelector('[contenteditable="true"]');

      if (sel && !sel.isCollapsed && activeEditor && activeEditor.contains(sel.anchorNode)) {
        setHasTextSelection(true);
        saveCurrentSelection();

        let node: Node | null = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        if (node && node instanceof HTMLElement) {
          const anchor = node.closest("a");
          if (anchor && anchor.getAttribute("href")) {
            setExistingLinkUrl(anchor.getAttribute("href") || "");
          } else {
            setExistingLinkUrl("");
          }
        }
      } else {
        setHasTextSelection(false);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const applyFontSize = (size: number) => {
    const activeEditor = document.querySelector('[contenteditable="true"]');
    if (!activeEditor) return;

    restoreSelection();

    const currentSel = window.getSelection();
    if (!currentSel || currentSel.rangeCount === 0 || !activeEditor.contains(currentSel.anchorNode)) {
      (activeEditor as HTMLElement).focus();
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      span.appendChild(document.createTextNode("\u200B"));
      range.insertNode(span);

      const newRange = document.createRange();
      newRange.setStart(span.firstChild!, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      globalSavedRangeRef.current = newRange.cloneRange();
    } else {
      document.execCommand("fontSize", false, "7");

      const fontEls = activeEditor.querySelectorAll('font[size="7"]');
      let firstSpan: HTMLElement | null = null;
      let lastSpan: HTMLElement | null = null;

      fontEls.forEach((fontEl) => {
        const span = document.createElement("span");
        span.style.fontSize = `${size}px`;
        while (fontEl.firstChild) {
          span.appendChild(fontEl.firstChild);
        }
        fontEl.parentNode?.replaceChild(span, fontEl);
        if (!firstSpan) firstSpan = span;
        lastSpan = span;
      });

      if (firstSpan && lastSpan) {
        const newRange = document.createRange();
        newRange.setStartBefore(firstSpan);
        newRange.setEndAfter(lastSpan);
        sel.removeAllRanges();
        sel.addRange(newRange);
        globalSavedRangeRef.current = newRange.cloneRange();
      }
    }

    activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
    triggerAutoSave(activeSlideId);
  };

  const applyLinkToSelection = (url: string) => {
    restoreSelection();

    const activeEditor = document.querySelector('[contenteditable="true"]');
    if (!activeEditor) return;

    const formattedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

    document.execCommand("createLink", false, formattedUrl);

    const links = activeEditor.querySelectorAll(`a[href="${formattedUrl}"]`);
    links.forEach((a) => {
      (a as HTMLElement).setAttribute("target", "_blank");
      (a as HTMLElement).setAttribute("rel", "noopener noreferrer");
      (a as HTMLElement).className = "text-brand-accent underline underline-offset-2 hover:text-brand-accent-hover cursor-pointer font-medium";
    });

    activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
    triggerAutoSave(activeSlideId);
    setLinkPopoverOpen(false);
  };

  const removeLinkFromSelection = () => {
    restoreSelection();
    document.execCommand("unlink", false);
    const activeEditor = document.querySelector('[contenteditable="true"]');
    if (activeEditor) {
      activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
    }
    triggerAutoSave(activeSlideId);
    setLinkPopoverOpen(false);
  };

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleCut = async () => {
    restoreSelection();
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const text = sel.toString();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        document.execCommand("copy");
      }
      document.execCommand("delete");
      const activeEditor = document.querySelector('[contenteditable="true"]');
      if (activeEditor) {
        activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
      }
      triggerAutoSave(activeSlideId);
    }
    setContextMenuPos(null);
  };

  const handleCopy = async () => {
    restoreSelection();
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const text = sel.toString();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        document.execCommand("copy");
      }
    }
    setContextMenuPos(null);
  };

  const handlePaste = async () => {
    restoreSelection();
    const activeEditor = document.querySelector('[contenteditable="true"]');
    if (activeEditor) {
      (activeEditor as HTMLElement).focus();
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          document.execCommand("insertText", false, text);
        } else {
          document.execCommand("paste");
        }
      } catch {
        document.execCommand("paste");
      }
      activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
      triggerAutoSave(activeSlideId);
    }
    setContextMenuPos(null);
  };

  const handleContextMenuLink = () => {
    restoreSelection();
    setContextMenuPos(null);
    if (hasTextSelection) {
      setLinkPopoverOpen(true);
    }
  };

  const handleSelectAll = () => {
    const activeEditor = document.querySelector('[contenteditable="true"]');
    if (activeEditor) {
      (activeEditor as HTMLElement).focus();
      document.execCommand("selectAll");
      saveCurrentSelection();
    }
    setContextMenuPos(null);
  };

  // Segment Operations
  const addSegment = async () => {
    if (!lessonId) return;
    try {
      const newSeg = await builderLessonService.createSegment(lessonId, `Segment ${segments.length + 1}`);
      const newSlide = newSeg.slides[0];

      const mappedSeg: SegmentData = {
        id: newSeg.id,
        title: newSeg.title,
        isExpanded: true,
        slides: [
          {
            id: newSlide.id,
            title: newSlide.title || "Slide 1",
            content: newSlide.coachText || "",
            hasBoard: false,
            fen: "",
            annotations: newSlide.annotations,
          },
        ],
      };

      const updatedSegments = [...segments, mappedSeg];
      setSegments(updatedSegments);
      setActiveSegmentId(mappedSeg.id);
      setActiveSlideId(newSlide.id);

      await lessonCacheService.saveLessonLocal({
        id: lessonId,
        title: lessonTitle,
        authorId: lesson?.authorId || "",
        status: lesson?.status || "DRAFT",
        segments: updatedSegments.map((s) => ({
          id: s.id,
          lessonId,
          title: s.title,
          order: 1,
          slides: s.slides.map((sl, idx) => ({
            id: sl.id,
            segmentId: s.id,
            order: idx + 1,
            coachText: sl.content,
            fen: sl.fen || "",
          })),
        })),
      });

      triggerAutoSave();
    } catch (error) {
      console.error("Failed to add segment", error);
    }
  };

  const toggleSegment = (segId: string) => {
    setSegments(
      segments.map((seg) =>
        seg.id === segId ? { ...seg, isExpanded: !seg.isExpanded } : seg
      )
    );
  };

  const updateSegmentTitle = async (segId: string, title: string) => {
    setSegments(
      segments.map((seg) => (seg.id === segId ? { ...seg, title } : seg))
    );
    triggerAutoSave(undefined, segId);
  };

  const deleteSegment = async (segId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (segments.length <= 1) return;
    const filtered = segments.filter((s) => s.id !== segId);
    setSegments(filtered);

    if (activeSegmentId === segId) {
      setActiveSegmentId(filtered[0].id);
      setActiveSlideId(filtered[0].slides[0]?.id || "");
    }

    if (lessonId) {
      await lessonCacheService.addPendingSync({
        lessonId,
        itemType: "segment",
        itemId: segId,
        action: "DELETE",
        payload: {},
      });
      triggerAutoSave();
    }
  };

  // Slide Operations
  const addSlide = async (segId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!lessonId) return;

    try {
      const newSlide = await builderLessonService.createSlide(lessonId, segId, {
        title: "New Slide",
        coachText: "",
        fen: "",
      });

      const mappedSlide: SlideData = {
        id: newSlide.id,
        title: newSlide.title || "New Slide",
        content: newSlide.coachText || "",
        hasBoard: false,
        fen: "",
        annotations: newSlide.annotations,
      };

      setSegments(
        segments.map((seg) =>
          seg.id === segId
            ? { ...seg, isExpanded: true, slides: [...seg.slides, mappedSlide] }
            : seg
        )
      );

      setActiveSegmentId(segId);
      setActiveSlideId(newSlide.id);
      triggerAutoSave();
    } catch (error) {
      console.error("Failed to create slide", error);
    }
  };

  const duplicateSlide = async (segId: string, slideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lessonId) return;

    try {
      const newSlide = await builderLessonService.createSlide(lessonId, segId, {
        duplicateFromSlideId: slideId,
      });

      const mappedSlide: SlideData = {
        id: newSlide.id,
        title: newSlide.title || "Copy",
        content: newSlide.coachText || "",
        hasBoard: Boolean(newSlide.fen && newSlide.fen.trim() !== ""),
        fen: newSlide.fen || "",
        annotations: newSlide.annotations,
      };

      const targetSeg = segments.find((s) => s.id === segId);
      if (!targetSeg) return;

      const slideIdx = targetSeg.slides.findIndex((sl) => sl.id === slideId);
      const newSlides = [...targetSeg.slides];
      newSlides.splice(slideIdx + 1, 0, mappedSlide);

      setSegments(
        segments.map((s) => (s.id === segId ? { ...s, slides: newSlides } : s))
      );

      setActiveSlideId(newSlide.id);
      triggerAutoSave();
    } catch (error) {
      console.error("Failed to duplicate slide", error);
    }
  };

  const deleteSlide = async (segId: string, slideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetSeg = segments.find((s) => s.id === segId);
    if (!targetSeg || targetSeg.slides.length <= 1) return;

    const newSlides = targetSeg.slides.filter((sl) => sl.id !== slideId);
    setSegments(
      segments.map((seg) => (seg.id === segId ? { ...seg, slides: newSlides } : seg))
    );

    if (activeSlideId === slideId) {
      setActiveSlideId(newSlides[0]?.id || "");
    }

    if (lessonId) {
      await lessonCacheService.addPendingSync({
        lessonId,
        itemType: "slide",
        itemId: slideId,
        action: "DELETE",
        payload: {},
      });
      triggerAutoSave();
    }
  };

  // Toggle Chessboard on active slide
  const toggleChessboard = () => {
    if (!activeSlide) return;
    const nextHasBoard = !activeSlide.hasBoard;
    const nextFen = nextHasBoard
      ? activeSlide.fen && activeSlide.fen.trim() !== ""
        ? activeSlide.fen
        : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      : "";

    updateActiveSlide({
      hasBoard: nextHasBoard,
      fen: nextFen,
    });
  };

  const [isCalloutActive, setIsCalloutActive] = useState<boolean>(false);

  const isInsideBlockquote = (): boolean => {
    if (typeof window === "undefined") return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
    while (node && node !== document.body) {
      if (node.nodeName && node.nodeName.toUpperCase() === "BLOCKQUOTE") {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  const toggleCoachCallout = () => {
    if (isInsideBlockquote()) {
      formatDocument("formatBlock", "<p>");
      setIsCalloutActive(false);
    } else {
      formatDocument("formatBlock", "<blockquote>");
      setIsCalloutActive(true);
    }
  };

  useEffect(() => {
    const checkSelection = () => {
      setIsCalloutActive(isInsideBlockquote());
    };

    document.addEventListener("selectionchange", checkSelection);
    return () => document.removeEventListener("selectionchange", checkSelection);
  }, []);

  // Slide counter
  let currentSlideNumber = 1;
  let totalSlidesCount = 0;
  segments.forEach((seg) => {
    seg.slides.forEach((sl) => {
      totalSlidesCount++;
      if (sl.id === activeSlideId) {
        currentSlideNumber = totalSlidesCount;
      }
    });
  });

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-brand-bg items-center justify-center text-brand-text">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="mt-4 font-sans text-brand-secondary text-sm">
          Loading lesson builder workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-brand-bg text-brand-text font-sans overflow-hidden select-none">
      {/* ── TOP HEADER & TOOLBAR ────────────────────────────────────────────── */}
      <div className="flex flex-col border-b border-brand-border bg-brand-bg/95 backdrop-blur-md shrink-0 relative z-30">
        {/* Title & Navigation Bar */}
        <LessonBuilderHeader
          lessonTitle={lessonTitle}
          onTitleChange={handleTitleChange}
          lessonStatus={lessonStatus}
          publishedAt={publishedAt}
          saveStatus={saveStatus}
          hasUnsyncedChanges={hasUnsyncedChanges}
          onForceCloudSync={handleForceCloudSync}
          onNavigateBack={() => {
            if (lessonId) lessonSyncService.processSyncQueue(lessonId);
            navigate("/lessons");
          }}
          onAddSegment={addSegment}
          onAddSlide={() => addSlide(activeSegmentId)}
          onOpenPublishModal={() => setPublishModalOpen(true)}
        />

        {/* Text Formatting Toolbar */}
        <LessonTextToolbar
          formatDocument={formatDocument}
          applyFontSize={applyFontSize}
          toggleCoachCallout={toggleCoachCallout}
          isCalloutActive={isCalloutActive}
          hasTextSelection={hasTextSelection}
          linkPopoverOpen={linkPopoverOpen}
          setLinkPopoverOpen={setLinkPopoverOpen}
          existingLinkUrl={existingLinkUrl}
          applyLinkToSelection={applyLinkToSelection}
          removeLinkFromSelection={removeLinkFromSelection}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          hasBoard={activeSlide?.hasBoard || false}
          toggleChessboard={toggleChessboard}
          saveCurrentSelection={saveCurrentSelection}
        />
      </div>

      {/* ── WORKSPACE SPLIT: SIDEBAR + CANVAS ─────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Sidebar: Segments & Slides with Drag & Drop */}
        <LessonBuilderSidebar
          segments={segments}
          setSegments={setSegments}
          activeSegmentId={activeSegmentId}
          setActiveSegmentId={setActiveSegmentId}
          activeSlideId={activeSlideId}
          setActiveSlideId={(slideId) => {
            const parentSeg = segments.find((s) => s.slides.some((sl) => sl.id === slideId));
            handleSelectSlide(slideId, parentSeg?.id || activeSegmentId);
          }}
          onAddSegment={addSegment}
          onToggleSegment={toggleSegment}
          onUpdateSegmentTitle={updateSegmentTitle}
          onDeleteSegment={deleteSegment}
          onAddSlide={addSlide}
          onDuplicateSlide={duplicateSlide}
          onDeleteSlide={deleteSlide}
          onAutoSaveTrigger={() => triggerAutoSave()}
        />

        {/* Center Main Workspace Canvas */}
        <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 bg-brand-bg overflow-y-auto relative">
          <LessonCanvas
            content={activeSlide?.content || ""}
            onContentChange={(newContent) => updateActiveSlide({ content: newContent })}
            hasBoard={activeSlide?.hasBoard || false}
            fen={activeSlide?.fen}
            onFenChange={(newFen) => updateActiveSlide({ fen: newFen })}
            onRemoveBoard={() => updateActiveSlide({ hasBoard: false })}
            zoomLevel={zoomLevel}
            onContextMenu={(x, y) => {
              saveCurrentSelection();
              setContextMenuPos({ x, y });
            }}
          />
        </main>
      </div>

      {/* Right-click Context Menu */}
      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          hasSelection={hasTextSelection}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onLink={handleContextMenuLink}
          onSelectAll={handleSelectAll}
          onClose={() => setContextMenuPos(null)}
        />
      )}

      {/* ── FOOTER STATUS BAR ──────────────────────────────────────────────── */}
      <LessonFooter
        currentSlideNumber={currentSlideNumber}
        totalSlidesCount={totalSlidesCount}
        activeSegmentTitle={activeSegment?.title}
        saveStatus={saveStatus}
      />

      {/* Publish Confirmation Modal */}
      {publishModalOpen && (
        <PublishConfirmationModal
          currentStatus={lessonStatus}
          isPublishing={isPublishing}
          isSavingDraft={isSavingDraft}
          onConfirmPublish={handlePublishLesson}
          onSaveAsDraft={handleSaveAsDraftAndExit}
          onClose={() => setPublishModalOpen(false)}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-[120] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border font-sans text-xs select-none animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50"
              : "bg-red-950/90 text-red-200 border-red-500/40 shadow-red-950/50"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Auth Modal for Session Synchronization */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
}
