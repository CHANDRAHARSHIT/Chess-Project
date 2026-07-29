import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Plus,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  FolderPlus,
  Layers,
  Sparkles,
  Grid,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  WifiOff,
  CloudUpload,
  HardDrive,
} from "lucide-react";
import { LessonCanvas } from "../components/lessons/LessonCanvas";
import { LessonBuilderSidebar } from "../components/lessons/LessonBuilderSidebar";
import {
  builderLessonService,
  type BuilderLessonData,
} from "../services/builderLesson.service";
import { lessonCacheService } from "../services/lessonCache.service";
import { lessonSyncService, type SyncState } from "../services/lessonSync.service";
import { AuthModal } from "../components/AuthModal";

interface SlideData {
  id: string;
  title: string;
  content: string;
  hasBoard: boolean;
  fen?: string;
  annotations?: any;
}

interface SegmentData {
  id: string;
  title: string;
  isExpanded: boolean;
  slides: SlideData[];
}

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
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef<boolean>(true);

  // Subscribe to sync service status changes
  useEffect(() => {
    const unsubscribe = lessonSyncService.subscribeStatus((status) => {
      setSaveStatus(status);
    });
    return unsubscribe;
  }, []);

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
          // If local version had no unsynced changes, update state with server version
          if (!cached || !cached._hasUnsyncedChanges) {
            applyLessonDataToState(serverData);
            await lessonCacheService.saveLessonLocal(serverData, false);
          } else {
            // Reconcile pending queue with server
            lessonSyncService.processSyncQueue(id);
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

  // Debounced Local Save (IndexedDB) & Background Sync Queueing
  const triggerAutoSave = (dirtySlideId?: string, dirtySegmentId?: string) => {
    if (!lessonId || isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

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
          status: lesson?.status || "DRAFT",
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

        // 1. Instant local persistence to IndexedDB
        await lessonCacheService.saveLessonLocal(updatedTree, true);

        // 2. Queue dirty mutation for incremental server sync
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

        lessonSyncService.setSyncState(navigator.onLine ? "saved" : "offline");
      } catch (error) {
        console.error("Local save error", error);
        lessonSyncService.setSyncState("error");
      }
    }, 3000);
  };

  // Select Slide Handler (Triggers Sync Queue)
  const handleSelectSlide = (slideId: string, segId: string) => {
    if (activeSlideId !== slideId) {
      setActiveSlideId(slideId);
      setActiveSegmentId(segId);
      if (lessonId && navigator.onLine) {
        lessonSyncService.processSyncQueue(lessonId);
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

      // Save to IndexedDB
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

      lessonSyncService.setSyncState(navigator.onLine ? "saved" : "offline");
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
      lessonSyncService.processSyncQueue(lessonId);
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
      lessonSyncService.setSyncState(navigator.onLine ? "saved" : "offline");
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
      lessonSyncService.setSyncState(navigator.onLine ? "saved" : "offline");
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
      lessonSyncService.processSyncQueue(lessonId);
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
      <div className="flex flex-col border-b border-brand-border bg-brand-bg/95 backdrop-blur-md shrink-0">
        {/* Title & Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-brand-border/40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (lessonId) lessonSyncService.processSyncQueue(lessonId);
                navigate("/lessons");
              }}
              title="Back to Lessons Dashboard"
              className="p-1.5 rounded-lg bg-brand-surface border border-brand-border/60 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
              <Layers className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="bg-transparent font-display font-medium text-lg text-brand-text outline-none px-2 py-0.5 rounded-md border border-transparent hover:border-brand-border focus:border-brand-accent/50 focus:bg-brand-surface/50 transition-all duration-200"
                placeholder="Untitled Lesson"
              />
              <span className="text-[11px] font-sans font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                {lesson?.status || "Draft"}
              </span>
            </div>
          </div>

          {/* Right Header Controls: Auto-save status & Action Buttons */}
          <div className="flex items-center gap-4">
            {/* Auto-save & Multi-layer Status Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              {saveStatus === "saving_local" && (
                <span className="flex items-center gap-1.5 text-brand-accent">
                  <HardDrive className="w-3.5 h-3.5 animate-pulse text-brand-accent" />
                  <span>Saving locally...</span>
                </span>
              )}
              {saveStatus === "syncing" && (
                <span className="flex items-center gap-1.5 text-blue-400">
                  <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
                  <span>Syncing...</span>
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === "offline" && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline (cached)</span>
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1.5 text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Sync failed</span>
                </span>
              )}
            </div>

            <button
              onClick={addSegment}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text text-xs font-medium transition-all duration-200 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-brand-accent" />
              <span>Add Segment</span>
            </button>

            <button
              onClick={() => addSlide(activeSegmentId)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accent-hover font-medium text-xs shadow-md transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slide</span>
            </button>
          </div>
        </div>

        {/* Minimal Formatting Toolbar */}
        <div className="flex items-center justify-between px-6 py-2 bg-brand-surface/40">
          <div className="flex items-center gap-1.5">
            <button
              title="Undo"
              onClick={() => formatDocument("undo")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
            >
              <Undo className="w-[18px] h-[18px]" />
            </button>
            <button
              title="Redo"
              onClick={() => formatDocument("redo")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
            >
              <Redo className="w-[18px] h-[18px]" />
            </button>

            <div className="w-px h-5 bg-brand-border mx-2" />

            <button
              title="Bold"
              onClick={() => formatDocument("bold")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer font-bold"
            >
              <Bold className="w-[18px] h-[18px]" />
            </button>
            <button
              title="Italic"
              onClick={() => formatDocument("italic")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer italic"
            >
              <Italic className="w-[18px] h-[18px]" />
            </button>
            <button
              title="Underline"
              onClick={() => formatDocument("underline")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer underline"
            >
              <Underline className="w-[18px] h-[18px]" />
            </button>
            <button
              title="Heading 1"
              onClick={() => formatDocument("formatBlock", "<h1>")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
            >
              <Heading1 className="w-[18px] h-[18px]" />
            </button>
            <button
              title="Heading 2"
              onClick={() => formatDocument("formatBlock", "<h2>")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
            >
              <Heading2 className="w-[18px] h-[18px]" />
            </button>

            <div className="w-px h-5 bg-brand-border mx-2" />

            <button
              title="Zoom Out"
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-[18px] h-[18px]" />
            </button>
            <span className="text-xs font-mono text-brand-secondary min-w-[40px] text-center">
              {zoomLevel}%
            </span>
            <button
              title="Zoom In"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-[18px] h-[18px]" />
            </button>

            <div className="w-px h-5 bg-brand-border mx-2" />

            <button
              title={activeSlide?.hasBoard ? "Remove Board" : "Insert Interactive Chessboard"}
              onClick={toggleChessboard}
              className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
                activeSlide?.hasBoard
                  ? "text-brand-accent bg-brand-accent/15 border border-brand-accent/30 shadow-[0_0_8px_rgba(212,175,110,0.15)]"
                  : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/5"
              }`}
            >
              <Grid className="w-[18px] h-[18px]" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-brand-secondary">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent/70" />
            <span className="font-sans">XLChess Lesson Builder</span>
          </div>
        </div>
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
        <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 bg-[#06080E] overflow-y-auto relative">
          <LessonCanvas
            content={activeSlide?.content || ""}
            onContentChange={(newContent) => updateActiveSlide({ content: newContent })}
            hasBoard={activeSlide?.hasBoard || false}
            fen={activeSlide?.fen}
            onFenChange={(newFen) => updateActiveSlide({ fen: newFen })}
            onRemoveBoard={() => updateActiveSlide({ hasBoard: false })}
            zoomLevel={zoomLevel}
          />
        </main>
      </div>

      {/* ── FOOTER STATUS BAR ──────────────────────────────────────────────── */}
      <footer className="h-8 border-t border-brand-border bg-brand-bg px-6 flex items-center justify-between text-xs text-brand-secondary shrink-0">
        <div className="flex items-center gap-4 font-sans">
          <span>
            Slide <strong className="text-brand-text">{currentSlideNumber}</strong> of{" "}
            <strong className="text-brand-text">{totalSlidesCount}</strong>
          </span>
          <span className="text-brand-border">•</span>
          <span className="text-brand-secondary/80">
            {activeSegment?.title || "Segment"}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>16:9 Canvas</span>
          <span className="text-brand-border">•</span>
          <span>1920 × 1080</span>
        </div>
      </footer>

      {/* Auth Modal for Session Synchronization */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
}
