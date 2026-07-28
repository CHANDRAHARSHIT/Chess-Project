import React, { useState } from "react";
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
  Grid,
  Type,
  FolderPlus,
  Layers,
  Sparkles,
  ArrowLeftRight,
  GripVertical
} from "lucide-react";

// --- STATE INITIALIZATION ---
const INITIAL_SEGMENTS = [
  {
    id: "seg-1",
    title: "Introduction",
    isExpanded: true,
    slides: [
      { 
        id: "slide-1", 
        title: "Slide 1",
        content: "Welcome to this interactive chess lesson.\n\nIn this position, White has a strong advantage...",
        hasBoard: true,
        boardPosition: "right"
      },
      { 
        id: "slide-2", 
        title: "Slide 2",
        content: "Notice how the bishop controls the long diagonal.",
        hasBoard: true,
        boardPosition: "left"
      },
    ],
  },
  {
    id: "seg-2",
    title: "Core Concepts",
    isExpanded: true,
    slides: [{ 
      id: "slide-3", 
      title: "Slide 3",
      content: "Let's review the opening principles.",
      hasBoard: false,
      boardPosition: "right"
    }],
  },
];

export default function LessonBuilderPage() {
  const [segments, setSegments] = useState(INITIAL_SEGMENTS);
  const [activeSegmentId, setActiveSegmentId] = useState("seg-1");
  const [activeSlideId, setActiveSlideId] = useState("slide-1");
  const [lessonTitle, setLessonTitle] = useState("Untitled Lesson");
  const [zoomLevel, setZoomLevel] = useState(100);

  const addSegment = () => {
    const newSegId = `seg-${Date.now()}`;
    const newSlideId = `slide-${Date.now()}`;
    const newSegment = {
      id: newSegId,
      title: `Segment ${segments.length + 1}`,
      isExpanded: true,
      slides: [{ id: newSlideId, title: "New Slide", content: "", hasBoard: true, boardPosition: "right" }],
    };
    setSegments([...segments, newSegment]);
    setActiveSegmentId(newSegId);
    setActiveSlideId(newSlideId);
  };

  const toggleSegment = (segId) => {
    setSegments(
      segments.map((seg) =>
        seg.id === segId ? { ...seg, isExpanded: !seg.isExpanded } : seg
      )
    );
  };

  const updateSegmentTitle = (segId, title) => {
    setSegments(
      segments.map((seg) => (seg.id === segId ? { ...seg, title } : seg))
    );
  };

  const deleteSegment = (segId, e) => {
    e.stopPropagation();
    if (segments.length <= 1) return;
    const filtered = segments.filter((s) => s.id !== segId);
    setSegments(filtered);
    if (activeSegmentId === segId) {
      setActiveSegmentId(filtered[0].id);
      setActiveSlideId(filtered[0].slides[0]?.id || "");
    }
  };

  const addSlide = (segId, e) => {
    if (e) e.stopPropagation();
    const newSlideId = `slide-${Date.now()}`;
    const newSlide = {
      id: newSlideId,
      title: "New Slide",
      content: "",
      hasBoard: true,
      boardPosition: "right"
    };
    setSegments(
      segments.map((seg) => {
        if (seg.id === segId) {
          return { ...seg, isExpanded: true, slides: [...seg.slides, newSlide] };
        }
        return seg;
      })
    );
    setActiveSegmentId(segId);
    setActiveSlideId(newSlideId);
  };

  const duplicateSlide = (segId, slideId, e) => {
    e.stopPropagation();
    const targetSeg = segments.find((s) => s.id === segId);
    if (!targetSeg) return;

    const slideIdx = targetSeg.slides.findIndex((sl) => sl.id === slideId);
    if (slideIdx === -1) return;

    const sourceSlide = targetSeg.slides[slideIdx];
    const newSlide = {
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

  const deleteSlide = (segId, slideId, e) => {
    e.stopPropagation();
    setSegments(
      segments.map((seg) => {
        if (seg.id === segId) {
          if (seg.slides.length <= 1) return seg;
          const newSlides = seg.slides.filter((sl) => sl.id !== slideId);
          if (activeSlideId === slideId) {
            setActiveSlideId(newSlides[0]?.id || "");
          }
          return { ...seg, slides: newSlides };
        }
        return seg;
      })
    );
  };

  // Helper to get active slide data
  const activeSegment = segments.find(s => s.id === activeSegmentId);
  const currentSlide = activeSegment?.slides.find(s => s.id === activeSlideId);

  const updateCurrentSlide = (updates) => {
    setSegments(segments.map(seg => {
      if (seg.id === activeSegmentId) {
        return {
          ...seg,
          slides: seg.slides.map(sl => sl.id === activeSlideId ? { ...sl, ...updates } : sl)
        };
      }
      return seg;
    }));
  };

  const toggleBoardSide = () => {
    const newPos = currentSlide?.boardPosition === 'right' ? 'left' : 'right';
    updateCurrentSlide({ boardPosition: newPos });
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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#11131A] text-[#f1f5f9] font-sans overflow-hidden select-none">
      {/* ── TOP HEADER & TOOLBAR ────────────────────────────────────────────── */}
      <div className="flex flex-col border-b border-[#2a2d39] bg-[#11131A]/95 backdrop-blur-md shrink-0">
        
        {/* Title Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-[#2a2d39]/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#dcb974]/10 border border-[#dcb974]/30 flex items-center justify-center text-[#dcb974]">
              <Layers className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="bg-transparent font-display font-medium text-lg text-[#f1f5f9] outline-none px-2 py-0.5 rounded-md border border-transparent hover:border-[#2a2d39] focus:border-[#dcb974]/50 focus:bg-[#161922]/50 transition-all duration-200"
                placeholder="Untitled Lesson"
              />
              <span className="text-[11px] font-sans font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#dcb974]/10 text-[#dcb974] border border-[#dcb974]/20">
                Draft
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={addSegment}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161922] border border-[#2a2d39] hover:border-[#dcb974]/40 text-[#94a3b8] hover:text-[#f1f5f9] text-xs font-medium transition-all duration-200 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#dcb974]" />
              <span>Add Segment</span>
            </button>

            <button
              onClick={() => addSlide(activeSegmentId)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#dcb974] text-[#11131A] hover:bg-[#ceaa65] font-medium text-xs shadow-md transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slide</span>
            </button>
          </div>
        </div>

        {/* Minimal Toolbar Row */}
        <div className="flex items-center justify-between px-6 py-1.5 bg-[#161922]/40">
          <div className="flex items-center gap-1">
            <button
              title="Undo"
              className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#f1f5f9]/5 transition-colors cursor-pointer"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              title="Redo"
              className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#f1f5f9]/5 transition-colors cursor-pointer"
            >
              <Redo className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-[#2a2d39] mx-2" />

            <button
              title="Zoom Out"
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#f1f5f9]/5 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-[#94a3b8] min-w-[40px] text-center">
              {zoomLevel}%
            </span>
            <button
              title="Zoom In"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#f1f5f9]/5 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-[#2a2d39] mx-2" />

            <button
              title="Text Options (Coming Soon)"
              className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#f1f5f9]/5 transition-colors cursor-pointer"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Added dynamic styling to highlight when board is active */}
            <button
              title="Toggle Chessboard"
              onClick={() => updateCurrentSlide({ hasBoard: !currentSlide?.hasBoard })}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                currentSlide?.hasBoard 
                  ? "text-[#dcb974] bg-[#dcb974]/10 shadow-[0_0_8px_rgba(220,185,116,0.15)]" 
                  : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#f1f5f9]/5"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
            <Sparkles className="w-3.5 h-3.5 text-[#dcb974]/70" />
            <span className="font-sans">XLChess Lesson Builder</span>
          </div>
        </div>
      </div>

      {/* ── WORKSPACE SPLIT: SIDEBAR + CANVAS ─────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        
        {/* Left Sidebar: Segments & Slides */}
        <aside className="w-64 border-r border-[#2a2d39] bg-[#11131A] flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-[#2a2d39]/60 flex items-center justify-between">
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
              Segments & Slides
            </span>
            <button
              onClick={addSegment}
              title="Create New Segment"
              className="p-1 rounded hover:bg-[#f1f5f9]/5 text-[#94a3b8] hover:text-[#dcb974] transition-colors cursor-pointer"
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
                  className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#161922]/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {seg.isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
                    )}
                    <input
                      type="text"
                      value={seg.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateSegmentTitle(seg.id, e.target.value)}
                      className="bg-transparent text-xs font-semibold uppercase tracking-wider text-[#94a3b8] hover:text-[#f1f5f9] focus:text-[#f1f5f9] focus:bg-[#161922] outline-none w-full px-1 py-0.5 rounded transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => addSlide(seg.id, e)}
                      title="Add Slide to Segment"
                      className="p-1 rounded text-[#94a3b8] hover:text-[#dcb974] hover:bg-[#f1f5f9]/5 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {segments.length > 1 && (
                      <button
                        onClick={(e) => deleteSegment(seg.id, e)}
                        title="Delete Segment"
                        className="p-1 rounded text-[#94a3b8] hover:text-red-400 hover:bg-[#f1f5f9]/5 transition-colors"
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
                          <span className="text-[11px] font-mono text-[#94a3b8]/70 mt-3 w-4 text-right shrink-0">
                            {globalNum}
                          </span>

                          {/* Placeholder Slide Thumbnail */}
                          <div
                            className={`relative flex-1 aspect-[16/9] rounded-lg border transition-all duration-200 overflow-hidden bg-[#161922] ${
                              isActive
                                ? "border-[#dcb974] shadow-[0_0_12px_rgba(212,175,110,0.20)]"
                                : "border-[#2a2d39]/60 hover:border-[#2a2d39]"
                            }`}
                          >
                            <div className="w-full h-full bg-[#11131A]/60 p-2 flex flex-col justify-between">
                              <div className="w-1/3 h-1.5 bg-[#2a2d39]/40 rounded-full" />
                              <div className="w-full h-full flex items-center justify-center">
                                {slide.hasBoard ? (
                                  <Grid className="w-4 h-4 text-[#2a2d39]" />
                                ) : (
                                  <Type className="w-4 h-4 text-[#2a2d39]" />
                                )}
                              </div>
                            </div>

                            <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#11131A]/90 backdrop-blur-sm rounded p-1 border border-[#2a2d39]/50">
                              <button
                                onClick={(e) => duplicateSlide(seg.id, slide.id, e)}
                                title="Duplicate Slide"
                                className="p-0.5 text-[#94a3b8] hover:text-[#dcb974] transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              {seg.slides.length > 1 && (
                                <button
                                  onClick={(e) => deleteSlide(seg.id, slide.id, e)}
                                  title="Delete Slide"
                                  className="p-0.5 text-[#94a3b8] hover:text-red-400 transition-colors"
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

        {}
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-[#06080E] overflow-auto relative">
          
          <div
            style={{ transform: `scale(${zoomLevel / 100})` }}
            className="w-full max-w-5xl aspect-[16/9] bg-[#161922] rounded-xl border border-[rgba(212,175,110,0.18)] shadow-2xl transition-transform duration-150 flex relative overflow-hidden"
          >
            {/* Split layout based on slide configuration */}
            <div className={`w-full h-full p-8 flex gap-8 ${currentSlide?.boardPosition === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Text Area (Always present) */}
              <div className="flex-1 flex flex-col">
                <input 
                  type="text" 
                  value={currentSlide?.title || ""}
                  onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                  placeholder="Slide Title..."
                  className="bg-transparent text-2xl font-display font-medium text-[#f1f5f9] outline-none border-b border-transparent focus:border-[#dcb974]/30 pb-2 mb-4 transition-colors"
                />
                <textarea
                  value={currentSlide?.content || ""}
                  onChange={(e) => updateCurrentSlide({ content: e.target.value })}
                  placeholder="Click here to start typing your lesson notes, explanations, or concepts..."
                  className="flex-1 w-full bg-transparent text-[#94a3b8] hover:text-[#f1f5f9] focus:text-[#f1f5f9] resize-none outline-none text-lg font-sans leading-relaxed transition-colors"
                />
              </div>

              {/* Conditional Chessboard Area */}
              {currentSlide?.hasBoard && (
                <div className="w-[45%] h-full flex flex-col items-center justify-center relative group">
                  
                  {/* Hover Controls for Board Position */}
                  <div className="absolute -top-4 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 z-10">
                    <span className="text-[10px] uppercase tracking-wider text-[#dcb974] bg-[#11131A] px-2 py-1 rounded border border-[#dcb974]/20">
                      Interactive Board
                    </span>
                    <button 
                      onClick={toggleBoardSide}
                      title="Switch Board Side"
                      className="bg-[#11131A] p-1.5 rounded border border-[#2a2d39] text-[#94a3b8] hover:text-[#dcb974] hover:border-[#dcb974]/50 transition-all flex items-center gap-1 shadow-lg"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Swap</span>
                    </button>
                  </div>

                  {/* Chessboard Placeholder Grid */}
                  <div className="w-full aspect-square max-w-[400px] grid grid-cols-8 grid-rows-8 border-2 border-[#2a2d39] rounded overflow-hidden shadow-2xl relative">
                    {Array.from({length: 64}).map((_, i) => {
                      const row = Math.floor(i / 8);
                      const col = i % 8;
                      const isDark = (row + col) % 2 === 1;
                      return (
                        <div 
                          key={i} 
                          className={`${isDark ? 'bg-[#3b4358]' : 'bg-[#e2e8f0]/90'}`} 
                        />
                      );
                    })}
                    
                    {/* Placeholder Overlay to indicate drag/interactivity */}
                    <div className="absolute inset-0 bg-[#11131A]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                       <div className="bg-[#161922] text-[#f1f5f9] px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-[#2a2d39] shadow-xl">
                         <GripVertical className="w-4 h-4 text-[#dcb974]" />
                         Use toolbar to disable
                       </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-[#94a3b8] mt-6 font-mono text-center">
                    Board will be playable in viewer mode.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── FOOTER STATUS BAR ──────────────────────────────────────────────── */}
      <footer className="h-8 border-t border-[#2a2d39] bg-[#11131A] px-6 flex items-center justify-between text-xs text-[#94a3b8] shrink-0">
        <div className="flex items-center gap-4 font-sans">
          <span>
            Slide <strong className="text-[#f1f5f9]">{currentSlideNumber}</strong> of{" "}
            <strong className="text-[#f1f5f9]">{totalSlidesCount}</strong>
          </span>
          <span className="text-[#2a2d39]">•</span>
          <span className="text-[#94a3b8]/80">
            {activeSegment?.title || "Segment"}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>16:9 Canvas</span>
          <span className="text-[#2a2d39]">•</span>
          <span>1920 × 1080</span>
        </div>
      </footer>
    </div>
  );
}