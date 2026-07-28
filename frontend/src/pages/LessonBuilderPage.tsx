import { useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
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
} from "lucide-react";
import { LessonCanvas } from "../components/lessons/LessonCanvas";
import { ThemedChessboard } from "../components/ThemedChessboard";

interface SlideData {
  id: string;
  title: string;
  content: string;
  hasBoard: boolean;
  fen?: string;
}

interface SegmentData {
  id: string;
  title: string;
  isExpanded: boolean;
  slides: SlideData[];
}

const INITIAL_SEGMENTS: SegmentData[] = [
  {
    id: "seg-1",
    title: "Introduction",
    isExpanded: true,
    slides: [
      {
        id: "slide-1",
        title: "Slide 1",
        content: "<h2>Introduction</h2><p>Click anywhere in this canvas to begin writing your lesson content, explanations, or notes.</p>",
        hasBoard: true,
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      },
      {
        id: "slide-2",
        title: "Slide 2",
        content: "<h2>Key Concepts</h2><p>Add text or insert an interactive board using the toolbar above.</p>",
        hasBoard: false,
      },
    ],
  },
  {
    id: "seg-2",
    title: "Core Tactics",
    isExpanded: true,
    slides: [
      {
        id: "slide-3",
        title: "Slide 3",
        content: "",
        hasBoard: false,
      },
    ],
  },
];

export default function LessonBuilderPage() {
  const [segments, setSegments] = useState<SegmentData[]>(INITIAL_SEGMENTS);
  const [activeSegmentId, setActiveSegmentId] = useState<string>("seg-1");
  const [activeSlideId, setActiveSlideId] = useState<string>("slide-1");
  const [lessonTitle, setLessonTitle] = useState<string>("Untitled Lesson");
  const [zoomLevel, setZoomLevel] = useState<number>(100);

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
  };

  // Exec formatting command on document editor
  const formatDocument = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
  };

  // Segment Handlers
  const addSegment = () => {
    const newSegId = `seg-${Date.now()}`;
    const newSlideId = `slide-${Date.now()}`;
    const newSegment: SegmentData = {
      id: newSegId,
      title: `Segment ${segments.length + 1}`,
      isExpanded: true,
      slides: [
        {
          id: newSlideId,
          title: "New Slide",
          content: "",
          hasBoard: false,
        },
      ],
    };
    setSegments([...segments, newSegment]);
    setActiveSegmentId(newSegId);
    setActiveSlideId(newSlideId);
  };

  const toggleSegment = (segId: string) => {
    setSegments(
      segments.map((seg) =>
        seg.id === segId ? { ...seg, isExpanded: !seg.isExpanded } : seg
      )
    );
  };

  const updateSegmentTitle = (segId: string, title: string) => {
    setSegments(
      segments.map((seg) => (seg.id === segId ? { ...seg, title } : seg))
    );
  };

  const deleteSegment = (segId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (segments.length <= 1) return;
    const filtered = segments.filter((s) => s.id !== segId);
    setSegments(filtered);
    if (activeSegmentId === segId) {
      setActiveSegmentId(filtered[0].id);
      setActiveSlideId(filtered[0].slides[0]?.id || "");
    }
  };

  // Slide Handlers
  const addSlide = (segId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSlideId = `slide-${Date.now()}`;
    const newSlide: SlideData = {
      id: newSlideId,
      title: "New Slide",
      content: "",
      hasBoard: false,
    };
    setSegments(
      segments.map((seg) => {
        if (seg.id === segId) {
          return {
            ...seg,
            isExpanded: true,
            slides: [...seg.slides, newSlide],
          };
        }
        return seg;
      })
    );
    setActiveSegmentId(segId);
    setActiveSlideId(newSlideId);
  };

  const duplicateSlide = (segId: string, slideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetSeg = segments.find((s) => s.id === segId);
    if (!targetSeg) return;

    const slideIdx = targetSeg.slides.findIndex((sl) => sl.id === slideId);
    if (slideIdx === -1) return;

    const sourceSlide = targetSeg.slides[slideIdx];
    const newSlide: SlideData = {
      ...sourceSlide,
      id: `slide-${Date.now()}`,
      title: `${sourceSlide.title} (Copy)`,
    };

    const newSlides = [...targetSeg.slides];
    newSlides.splice(slideIdx + 1, 0, newSlide);

    setSegments(
      segments.map((s) => (s.id === segId ? { ...s, slides: newSlides } : s))
    );
    setActiveSlideId(newSlide.id);
  };

  const deleteSlide = (segId: string, slideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSegments(
      segments.map((seg) => {
        if (seg.id === segId) {
          if (seg.slides.length <= 1) return seg;
          const newSlides = seg.slides.filter((sl) => sl.id !== slideId);
          if (activeSlideId === slideId) {
            const nextSlide = newSlides[0]?.id || "";
            setActiveSlideId(nextSlide);
          }
          return { ...seg, slides: newSlides };
        }
        return seg;
      })
    );
  };

  // Find active slide data
  const activeSegment = segments.find((s) => s.id === activeSegmentId);
  const activeSlide = activeSegment?.slides.find((sl) => sl.id === activeSlideId);

  // Toggle or Insert Chessboard via Toolbar Image Button
  const toggleChessboard = () => {
    if (!activeSlide) return;
    updateActiveSlide({
      hasBoard: !activeSlide.hasBoard,
    });
  };

  // Find slide counter index
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-brand-bg text-brand-text font-sans overflow-hidden select-none">
      {/* ── TOP HEADER & TOOLBAR ────────────────────────────────────────────── */}
      <div className="flex flex-col border-b border-brand-border bg-brand-bg/95 backdrop-blur-md shrink-0">
        {/* Title Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-brand-border/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
              <Layers className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="bg-transparent font-display font-medium text-lg text-brand-text outline-none px-2 py-0.5 rounded-md border border-transparent hover:border-brand-border focus:border-brand-accent/50 focus:bg-brand-surface/50 transition-all duration-200"
                placeholder="Untitled Lesson"
              />
              <span className="text-[11px] font-sans font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                Draft
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Minimal Toolbar Row with Formatting Controls */}
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

            {/* Document Text Formatting Tools */}
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
        {/* Left Sidebar: Segments & Slides */}
        <aside className="w-64 border-r border-brand-border bg-brand-bg flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-brand-border/60 flex items-center justify-between">
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-secondary">
              Segments & Slides
            </span>
            <button
              onClick={addSegment}
              title="Create New Segment"
              className="p-1 rounded hover:bg-brand-text/5 text-brand-secondary hover:text-brand-accent transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {segments.map((seg, segIdx) => (
              <div key={seg.id} className="space-y-1.5">
                {/* Segment Header */}
                <div
                  onClick={() => toggleSegment(seg.id)}
                  className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-brand-surface/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {seg.isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
                    )}
                    <input
                      type="text"
                      value={seg.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateSegmentTitle(seg.id, e.target.value)}
                      className="bg-transparent text-xs font-semibold uppercase tracking-wider text-brand-secondary hover:text-brand-text focus:text-brand-text focus:bg-brand-surface outline-none w-full px-1 py-0.5 rounded transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => addSlide(seg.id, e)}
                      title="Add Slide to Segment"
                      className="p-1 rounded text-brand-secondary hover:text-brand-accent hover:bg-brand-text/5 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {segments.length > 1 && (
                      <button
                        onClick={(e) => deleteSegment(seg.id, e)}
                        title="Delete Segment"
                        className="p-1 rounded text-brand-secondary hover:text-red-400 hover:bg-brand-text/5 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Slides List */}
                {seg.isExpanded && (
                  <div className="pl-2 space-y-2">
                    {seg.slides.map((slide, slideIdx) => {
                      const isActive = activeSlideId === slide.id;

                      let globalNum = 1;
                      for (let i = 0; i < segIdx; i++) {
                        globalNum += segments[i].slides.length;
                      }
                      globalNum += slideIdx;

                      return (
                        <div
                          key={slide.id}
                          onClick={() => {
                            setActiveSlideId(slide.id);
                            setActiveSegmentId(seg.id);
                          }}
                          className="group flex items-start gap-2 cursor-pointer"
                        >
                          <span className="text-[11px] font-mono text-brand-secondary/70 mt-3 w-4 text-right shrink-0">
                            {globalNum}
                          </span>

                          {/* Miniature True Slide Preview */}
                          <div
                            className={`relative flex-1 aspect-[16/9] rounded-lg border transition-all duration-200 overflow-hidden bg-brand-surface ${
                              isActive
                                ? "border-brand-accent shadow-[0_0_12px_rgba(212,175,110,0.20)]"
                                : "border-brand-border/60 hover:border-brand-border"
                            }`}
                          >
                            <div className="w-full h-full bg-brand-surface p-2 relative overflow-hidden select-none pointer-events-none text-brand-text font-sans leading-tight">
                              {/* Mini Board preview on right if board is present */}
                              {slide.hasBoard && (
                                <div className="float-right ml-1 mb-1 w-[44%] aspect-square rounded overflow-hidden border border-brand-border/40 bg-brand-bg">
                                  <ThemedChessboard
                                    options={{
                                      position:
                                        slide.fen ||
                                        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                                      showNotation: false,
                                      allowDragging: false,
                                    }}
                                  />
                                </div>
                              )}

                              {/* Render actual scaled slide text content */}
                              {slide.content && slide.content.trim() !== "" ? (
                                <div
                                  className="w-full h-full break-words text-brand-text/90 [&_h1]:text-[8px] [&_h1]:font-bold [&_h1]:text-brand-text [&_h1]:mb-0.5 [&_h2]:text-[7.5px] [&_h2]:font-semibold [&_h2]:text-brand-text [&_h2]:mb-0.5 [&_h3]:text-[7px] [&_h3]:font-medium [&_h3]:text-brand-text [&_h3]:mb-0.5 [&_p]:text-[6px] [&_p]:leading-tight [&_p]:text-brand-text/80 [&_p]:mb-0.5"
                                  dangerouslySetInnerHTML={{ __html: slide.content }}
                                />
                              ) : (
                                <span className="text-[6.5px] text-brand-secondary/40 italic">
                                  Blank slide...
                                </span>
                              )}
                            </div>

                            <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-bg/90 backdrop-blur-sm rounded p-1 border border-brand-border/50">
                              <button
                                onClick={(e) => duplicateSlide(seg.id, slide.id, e)}
                                title="Duplicate Slide"
                                className="p-0.5 text-brand-secondary hover:text-brand-accent transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              {seg.slides.length > 1 && (
                                <button
                                  onClick={(e) => deleteSlide(seg.id, slide.id, e)}
                                  title="Delete Slide"
                                  className="p-0.5 text-brand-secondary hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Center Main Workspace Canvas */}
        <main className="flex-1 flex flex-col items-center justify-start p-8 bg-[#06080E] overflow-y-auto relative">
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
    </div>
  );
}
