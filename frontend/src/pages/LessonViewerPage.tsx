import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lock,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  BookOpen,
  Layers,
  Award,
} from "lucide-react";

interface Slide {
  id: string;
}

interface Segment {
  id: string;
  title: string;
  slides: Slide[];
}

const LESSON_SEGMENTS: Segment[] = [
  {
    id: "seg-1",
    title: "Segment 1 - Introduction",
    slides: [{ id: "s1-1" }, { id: "s1-2" }],
  },
  {
    id: "seg-2",
    title: "Segment 2 - Opening Ideas",
    slides: [{ id: "s2-1" }, { id: "s2-2" }, { id: "s2-3" }],
  },
  {
    id: "seg-3",
    title: "Segment 3 - Tactical Example",
    slides: [{ id: "s3-1" }, { id: "s3-2" }],
  },
  {
    id: "seg-4",
    title: "Segment 4 - Summary",
    slides: [{ id: "s4-1" }],
  },
];

export default function LessonViewerPage() {
  const navigate = useNavigate();
  const { id: _id } = useParams(); // eslint-disable-line @typescript-eslint/no-unused-vars -- reserved for future route use

  const [unlockedSegmentsCount, setUnlockedSegmentsCount] = useState<number>(1);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const currentSegment = LESSON_SEGMENTS[activeSegmentIndex];
  const isLastSlideInSegment =
    activeSlideIndex === (currentSegment?.slides.length || 0) - 1;
  const isLastSegment = activeSegmentIndex === LESSON_SEGMENTS.length - 1;

  // Handlers
  const handleNextSlide = () => {
    if (activeSlideIndex < currentSegment.slides.length - 1) {
      setActiveSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1);
    } else if (activeSegmentIndex > 0) {
      // Go to previous segment's last slide
      const prevSegIndex = activeSegmentIndex - 1;
      setActiveSegmentIndex(prevSegIndex);
      setActiveSlideIndex(LESSON_SEGMENTS[prevSegIndex].slides.length - 1);
    }
  };

  const handleMoveToNextSegment = () => {
    if (isLastSegment && isLastSlideInSegment) {
      setIsCompleted(true);
      return;
    }

    const nextSegIndex = activeSegmentIndex + 1;
    if (nextSegIndex < LESSON_SEGMENTS.length) {
      if (nextSegIndex >= unlockedSegmentsCount) {
        setUnlockedSegmentsCount(nextSegIndex + 1);
      }
      setActiveSegmentIndex(nextSegIndex);
      setActiveSlideIndex(0);
    }
  };

  const handleRestart = () => {
    setUnlockedSegmentsCount(1);
    setActiveSegmentIndex(0);
    setActiveSlideIndex(0);
    setIsCompleted(false);
  };

  const calculateProgressPercent = () => {
    let totalSlides = 0;
    let completedSlides = 0;
    LESSON_SEGMENTS.forEach((seg, sIdx) => {
      seg.slides.forEach((_, slIdx) => {
        totalSlides++;
        if (
          sIdx < activeSegmentIndex ||
          (sIdx === activeSegmentIndex && slIdx <= activeSlideIndex)
        ) {
          completedSlides++;
        }
      });
    });
    if (isCompleted) return 100;
    return Math.round((completedSlides / totalSlides) * 100);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-surface/60 border border-brand-border p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/lessons")}
            className="p-2 rounded-xl bg-brand-bg hover:bg-brand-surface border border-brand-border/60 text-brand-secondary hover:text-brand-text transition-colors cursor-pointer"
            title="Back to Lesson Library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-accent uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Interactive Lesson Viewer</span>
            </div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-brand-text">
              Mastering Chess Fundamentals
            </h1>
          </div>
        </div>

        {/* Progress Pill */}
        <div className="w-full sm:w-auto flex items-center gap-3 bg-brand-bg/80 border border-brand-border/40 px-4 py-2 rounded-xl">
          <Award className="w-4 h-4 text-brand-accent shrink-0" />
          <div className="flex-1 sm:w-32 space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-brand-secondary">
              <span>Progress</span>
              <span className="text-brand-text">
                {calculateProgressPercent()}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-brand-border/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-accent to-emerald-400 transition-all duration-300"
                style={{ width: `${calculateProgressPercent()}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Segments + Slide Player */}
      {isCompleted ? (
        /* Completion View */
        <div className="p-8 sm:p-12 lg:p-16 rounded-3xl bg-gradient-to-b from-brand-surface via-brand-surface/90 to-brand-bg border border-brand-border text-center space-y-6">
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="font-display font-black text-3xl sm:text-4xl text-brand-text">
              Lesson Completed! 🎉
            </h2>
            <p className="text-sm text-brand-secondary">
              Congratulations! You have finished all 4 segments of{" "}
              <strong className="text-brand-text">
                Mastering Chess Fundamentals
              </strong>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-surface hover:bg-brand-surface/80 border border-brand-border text-brand-text font-semibold text-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart Lesson</span>
            </button>

            <button
              onClick={() => navigate("/lessons")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-bold text-sm transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Return to Lesson Library</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Segment Drawer / Navigation (1 Column on Desktop) */}
          <div className="lg:col-span-1 space-y-3 bg-brand-surface/60 border border-brand-border p-4 rounded-2xl h-fit">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/40">
              <span className="text-xs font-bold text-brand-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-accent" />
                Lesson Segments
              </span>
              <span className="text-[11px] font-medium text-brand-secondary">
                {unlockedSegmentsCount} / {LESSON_SEGMENTS.length} Unlocked
              </span>
            </div>

            <div className="space-y-2">
              {LESSON_SEGMENTS.map((segment, segIdx) => {
                const isUnlocked = segIdx < unlockedSegmentsCount;
                const isActive = segIdx === activeSegmentIndex;
                const isFinished =
                  segIdx < unlockedSegmentsCount - 1 ||
                  segIdx < activeSegmentIndex;

                return (
                  <div
                    key={segment.id}
                    onClick={() => {
                      if (isUnlocked) {
                        setActiveSegmentIndex(segIdx);
                        setActiveSlideIndex(0);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? "bg-brand-accent/10 border-brand-accent/50 text-brand-text"
                        : isUnlocked
                          ? "bg-brand-bg/50 border-brand-border/40 hover:bg-brand-surface text-brand-secondary hover:text-brand-text cursor-pointer"
                          : "bg-brand-bg/20 border-brand-border/20 text-brand-secondary/40 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-tight">
                        {segment.title}
                      </span>
                      {isUnlocked ? (
                        isActive ? (
                          <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping" />
                        ) : isFinished ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-brand-accent/60" />
                        )
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-amber-400/80" />
                      )}
                    </div>

                    {/* Sub-slides indicator */}
                    <div className="mt-2 flex items-center gap-1">
                      {segment.slides.map((_, slideIdx) => {
                        const isSlideActive =
                          isActive && slideIdx === activeSlideIndex;
                        return (
                          <div
                            key={slideIdx}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              isSlideActive
                                ? "bg-brand-accent"
                                : isActive && slideIdx < activeSlideIndex
                                  ? "bg-emerald-400"
                                  : isUnlocked
                                    ? "bg-brand-border/50"
                                    : "bg-brand-border/20"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slide Viewer (3 Columns on Desktop) */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            {/* The Slide Display Box */}
            <div className="relative rounded-3xl overflow-hidden bg-brand-surface border border-brand-border flex flex-col min-h-[420px] sm:min-h-[480px]">
              {/* SLIDE VISUAL AREA WITH FULL COMING SOON BANNER */}
              <div className="relative flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-brand-surface via-brand-bg to-brand-surface overflow-hidden">
                {/* Visual Chess Graphic Background Patterns */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-accent/15 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

                {/* SLIDE "COMING SOON" DISPLAY */}
                <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-amber-500/30 space-y-3 flex flex-col items-center justify-center">
                  <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-amber-400 tracking-wider">
                    Coming Soon
                  </h3>
                </div>
              </div>

              {/* Slide Meta Info Footer */}
              <div className="p-4 sm:p-5 bg-brand-bg/80 border-t border-brand-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-brand-accent/10 text-brand-accent font-semibold">
                    {currentSegment?.title}
                  </span>
                  <span className="text-brand-secondary">
                    Slide {activeSlideIndex + 1} of{" "}
                    {currentSegment?.slides.length}
                  </span>
                </div>

                <div className="text-brand-secondary/80 italic text-[11px]">
                  Use the navigation controls below to proceed through slides.
                </div>
              </div>
            </div>

            {/* Navigation Controls Below the Slide */}
            <div className="flex items-center justify-between bg-brand-surface/60 border border-brand-border p-4 rounded-2xl">
              {/* Prev Button */}
              <button
                onClick={handlePrevSlide}
                disabled={activeSegmentIndex === 0 && activeSlideIndex === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-surface border border-brand-border/60 text-brand-text font-semibold text-xs sm:text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {/* Slide Indicator */}
              <div className="text-xs font-bold text-brand-secondary">
                Slide {activeSlideIndex + 1} / {currentSegment?.slides.length}
              </div>

              {/* Next Slide or Move to Next Segment Button */}
              {isLastSlideInSegment ? (
                <button
                  onClick={handleMoveToNextSegment}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-accent to-amber-500 hover:brightness-110 text-brand-bg font-extrabold text-xs sm:text-sm transition-all duration-200 cursor-pointer animate-pulse"
                >
                  <span>
                    {isLastSegment ? "Complete Lesson" : "Next Segment"}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleNextSlide}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer"
                >
                  <span>Next Slide</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
