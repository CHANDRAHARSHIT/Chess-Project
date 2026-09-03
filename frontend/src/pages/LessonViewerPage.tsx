import { useState, useEffect } from "react";
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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { publicLessonService } from "@/services/lessons-publicLesson.service";
import type { BuilderLessonData } from "@/services/lessons-builderLesson.service";
import { ThemedChessboard } from "@/components/ui-ThemedChessboard";

export default function LessonViewerPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [lesson, setLesson] = useState<BuilderLessonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [unlockedSegmentsCount, setUnlockedSegmentsCount] = useState<number>(1);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadLesson(id);
    } else {
      setError("No lesson ID provided");
      setLoading(false);
    }
  }, [id]);

  const loadLesson = async (lessonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await publicLessonService.getPublishedLessonById(lessonId);
      setLesson(data);
      setUnlockedSegmentsCount(1);
      setActiveSegmentIndex(0);
      setActiveSlideIndex(0);
      setIsCompleted(false);
    } catch (err: any) {
      console.error("Failed to load published lesson", err);
      if (err?.message === "NOT_FOUND") {
        setError("Published lesson not found or is currently private.");
      } else {
        setError("Failed to load lesson. Please check your internet connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const segments = lesson?.segments || [];
  const currentSegment = segments[activeSegmentIndex];
  const currentSlides = currentSegment?.slides || [];
  const currentSlide = currentSlides[activeSlideIndex];

  const isLastSlideInSegment = activeSlideIndex === (currentSlides.length || 0) - 1;
  const isLastSegment = activeSegmentIndex === segments.length - 1;

  // Handlers
  const handleNextSlide = () => {
    if (activeSlideIndex < currentSlides.length - 1) {
      setActiveSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1);
    } else if (activeSegmentIndex > 0) {
      const prevSegIndex = activeSegmentIndex - 1;
      setActiveSegmentIndex(prevSegIndex);
      const prevSlides = segments[prevSegIndex]?.slides || [];
      setActiveSlideIndex(Math.max(0, prevSlides.length - 1));
    }
  };

  const handleMoveToNextSegment = () => {
    if (isLastSegment && isLastSlideInSegment) {
      setIsCompleted(true);
      return;
    }

    const nextSegIndex = activeSegmentIndex + 1;
    if (nextSegIndex < segments.length) {
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
    if (isCompleted) return 100;
    let totalSlides = 0;
    let completedSlides = 0;
    segments.forEach((seg, sIdx) => {
      const slidesInSeg = seg.slides || [];
      slidesInSeg.forEach((_, slIdx) => {
        totalSlides++;
        if (
          sIdx < activeSegmentIndex ||
          (sIdx === activeSegmentIndex && slIdx <= activeSlideIndex)
        ) {
          completedSlides++;
        }
      });
    });
    if (totalSlides === 0) return 0;
    return Math.round((completedSlides / totalSlides) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-brand-bg text-brand-text p-6">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="mt-4 font-sans text-brand-secondary text-sm">
          Loading lesson content...
        </p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-brand-bg text-brand-text p-6">
        <div className="p-8 rounded-3xl bg-brand-surface border border-brand-border text-center space-y-4 max-w-md">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-xl text-brand-text">
            {error || "Lesson Unavailable"}
          </h2>
          <p className="text-xs text-brand-secondary leading-relaxed">
            This lesson might have been unpublished, deleted, or is currently unavailable.
          </p>
          <button
            type="button"
            onClick={() => navigate("/lessons")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent text-brand-bg font-semibold text-xs transition-all hover:bg-brand-accent-hover cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Lesson Library</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-2.5 py-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none">
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
              {lesson.title}
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
              Congratulations! You have finished all {segments.length} segments of{" "}
              <strong className="text-brand-text">{lesson.title}</strong>.
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
                {unlockedSegmentsCount} / {segments.length} Unlocked
              </span>
            </div>

            <div className="space-y-2">
              {segments.map((segment, segIdx) => {
                const isUnlocked = segIdx < unlockedSegmentsCount;
                const isActive = segIdx === activeSegmentIndex;
                const isFinished =
                  segIdx < unlockedSegmentsCount - 1 || segIdx < activeSegmentIndex;

                const segSlides = segment.slides || [];

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
                      {segSlides.map((_, slideIdx) => {
                        const isSlideActive = isActive && slideIdx === activeSlideIndex;
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
            <div className="relative rounded-3xl overflow-hidden bg-brand-surface border border-brand-border flex flex-col min-h-[440px] sm:min-h-[500px]">
              {currentSlide ? (
                <div className="flex-1 flex flex-col lg:flex-row items-stretch p-6 gap-6 bg-gradient-to-br from-brand-surface via-brand-bg to-brand-surface overflow-hidden">
                  {/* Left Column: Interactive Board (if slide has FEN) */}
                  {currentSlide.fen && currentSlide.fen.trim() !== "" && (
                    <div className="flex-1 flex items-center justify-center max-w-md mx-auto w-full shrink-0">
                      <div className="w-full aspect-square max-w-[400px] rounded-2xl overflow-hidden shadow-2xl border border-brand-border/60 bg-brand-surface/90 p-2">
                        <ThemedChessboard options={{ position: currentSlide.fen }} />
                      </div>
                    </div>
                  )}

                  {/* Right Column: Slide Text / Content */}
                  <div className="flex-1 flex flex-col justify-start space-y-4 overflow-y-auto max-h-[460px] pr-2">
                    {currentSlide.title && (
                      <h3 className="font-display font-extrabold text-xl sm:text-2xl text-brand-text">
                        {currentSlide.title}
                      </h3>
                    )}

                    <div
                      className="prose prose-invert max-w-none text-sm text-brand-secondary leading-relaxed font-sans space-y-2 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-brand-text [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-brand-text [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-brand-text [&_blockquote]:border-l-4 [&_blockquote]:border-brand-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-brand-accent [&_a]:underline"
                      dangerouslySetInnerHTML={{
                        __html: currentSlide.coachText || "<p>No text content for this slide.</p>",
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* Empty Slide Fallback */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-brand-secondary space-y-3">
                  <BookOpen className="w-10 h-10 text-brand-secondary/40" />
                  <p className="text-sm font-medium">This segment does not contain any slides yet.</p>
                </div>
              )}

              {/* Slide Meta Info Footer */}
              <div className="p-4 sm:p-5 bg-brand-bg/80 border-t border-brand-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-brand-accent/10 text-brand-accent font-semibold">
                    {currentSegment?.title || "Segment"}
                  </span>
                  <span className="text-brand-secondary">
                    Slide {activeSlideIndex + 1} of {currentSlides.length || 1}
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
                Slide {activeSlideIndex + 1} / {currentSlides.length || 1}
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
