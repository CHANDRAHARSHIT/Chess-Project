import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Plus,
  Search,
  MoreVertical,
  BookOpen,
  Trash2,
  Clock,
  Grid as GridIcon,
  List,
  Loader2,
  Sparkles,
  Layers,
  Globe,
  Tag,
  ChevronRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useSession } from "@/features/account/useSession";
import {
  builderLessonService,
  type BuilderLessonData,
} from "@/features/lessons/builderLesson.service";
import { AuthModal } from "@/features/account/AuthModal";
import { getNextUntitledTitle } from "@/features/lessons/utils/lessonNaming";
import { ThumbnailEditorModal } from "@/features/lessons/components/ThumbnailEditorModal";
import { ThumbnailComingSoonModal } from "@/features/lessons/components/ThumbnailComingSoonModal";

const TEMPLATES = [
  {
    id: "t-blank",
    name: "Blank Lesson",
    description: "Start from scratch with a blank sheet and board.",
    icon: Plus,
    color: "text-brand-accent",
    bgColor: "bg-brand-accent/10 border-brand-accent/30",
  },
];

const CATEGORY_OPTIONS = [
  "Fundamentals",
  "Openings",
  "Tactics",
  "Endgame",
  "Strategy",
];

// ─────────────────────────────────────────────────────────────────────────────
// Viewport-Aware Floating Portal Popover Options Menu
// ─────────────────────────────────────────────────────────────────────────────

interface PortalLessonOptionsMenuProps {
  buttonRect: DOMRect;
  lesson: BuilderLessonData;
  onAddThumbnail: (e: React.MouseEvent) => void;
  onTogglePublish: (e: React.MouseEvent) => void;
  onSetCategory: (cat: string | null, e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onClose: () => void;
}

function PortalLessonOptionsMenu({
  buttonRect,
  lesson,
  onAddThumbnail,
  onTogglePublish,
  onSetCategory,
  onDelete,
  onClose,
}: PortalLessonOptionsMenuProps) {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const markCategoryBtnRef = useRef<HTMLButtonElement | null>(null);

  const menuWidth = 210;
  const menuHeight = 175;
  const vWidth = window.innerWidth;
  const vHeight = window.innerHeight;

  // Vertical Placement (Upward vs Downward)
  const spaceBelow = vHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;
  const openUpward = spaceBelow < menuHeight + 16 && spaceAbove > spaceBelow;

  let top = openUpward
    ? buttonRect.top - menuHeight - 6
    : buttonRect.bottom + 6;

  top = Math.max(8, Math.min(top, vHeight - menuHeight - 8));

  // Horizontal Placement (Reposition if near right edge)
  let left = buttonRect.right - menuWidth;
  left = Math.max(8, Math.min(left, vWidth - menuWidth - 8));

  // Submenu Positioning (Left vs Right of main menu, clamped to viewport)
  const submenuWidth = 176;
  const submenuHeight = 225;

  let submenuLeft = left - submenuWidth - 4; // default left of menu
  if (left - submenuWidth < 8 && left + menuWidth + submenuWidth <= vWidth - 8) {
    submenuLeft = left + menuWidth + 4; // open right
  } else if (left - submenuWidth < 8) {
    submenuLeft = Math.max(8, left - submenuWidth);
  }

  let submenuTop = top + 75;
  if (markCategoryBtnRef.current) {
    const markRect = markCategoryBtnRef.current.getBoundingClientRect();
    submenuTop = Math.max(8, Math.min(markRect.top, vHeight - submenuHeight - 8));
  } else {
    submenuTop = Math.max(8, Math.min(top + 75, vHeight - submenuHeight - 8));
  }

  // Auto-close menu on page scroll or window resize
  useEffect(() => {
    const handleScrollOrResize = () => {
      onClose();
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ top: `${top}px`, left: `${left}px` }}
      className="fixed z-[100] w-[210px] bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-1 font-sans text-xs text-brand-text animate-in fade-in zoom-in-95 duration-150 select-none max-h-[calc(100vh-16px)] overflow-y-auto"
    >
      {/* 1. Add Thumbnail */}
      <button
        type="button"
        onClick={onAddThumbnail}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
      >
        <ImageIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" />
        <span>Add Thumbnail</span>
      </button>

      {/* 2. Publish / Unpublish */}
      <button
        type="button"
        onClick={onTogglePublish}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
      >
        <Globe className="w-3.5 h-3.5 text-brand-accent shrink-0" />
        <span>{lesson.status === "PUBLISHED" ? "Unpublish" : "Publish"}</span>
      </button>

      <div className="my-1 border-t border-brand-border/40" />

      {/* 3. Mark Category > with Flyout Submenu */}
      <div
        className="relative"
        onMouseEnter={() => setSubmenuOpen(true)}
        onMouseLeave={() => setSubmenuOpen(false)}
      >
        <button
          ref={markCategoryBtnRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSubmenuOpen((prev) => !prev);
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-brand-accent shrink-0" />
            <span>Mark Category</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-brand-secondary/70 shrink-0" />
        </button>
      </div>

      <div className="my-1 border-t border-brand-border/40" />

      {/* 4. Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5 shrink-0" />
        <span>Delete</span>
      </button>

      {/* Category Submenu Portal */}
      {submenuOpen &&
        createPortal(
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseEnter={() => setSubmenuOpen(true)}
            onMouseLeave={() => setSubmenuOpen(false)}
            style={{ top: `${submenuTop}px`, left: `${submenuLeft}px` }}
            className="fixed z-[105] w-[176px] bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-1 font-sans text-xs text-brand-text animate-in fade-in zoom-in-95 duration-150 select-none max-h-[calc(100vh-16px)] overflow-y-auto"
          >
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = lesson.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={(e) => onSetCategory(cat, e)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-brand-accent/15 text-brand-accent font-semibold"
                      : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/5"
                  }`}
                >
                  <span>{cat}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                  )}
                </button>
              );
            })}

            <div className="my-1 border-t border-brand-border/40" />

            {/* No Category */}
            <button
              type="button"
              onClick={(e) => onSetCategory(null, e)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                !lesson.category
                  ? "bg-brand-accent/15 text-brand-accent font-semibold"
                  : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/5"
              }`}
            >
              <span>No Category</span>
              {!lesson.category && (
                <Check className="w-3.5 h-3.5 text-brand-accent shrink-0" />
              )}
            </button>
          </div>,
          document.body
        )}
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LessonDashboardPage Component
// ─────────────────────────────────────────────────────────────────────────────

export default function LessonDashboardPage() {
  const { status } = useSession();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState<BuilderLessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "DRAFT" | "PUBLISHED">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Portal Popover State: stores active lesson ID & trigger button bounds
  const [activeMenuState, setActiveMenuState] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Frontend-only temporary thumbnail preview state
  const [tempThumbnails, setTempThumbnails] = useState<Record<string, string>>({});
  const [targetThumbnailLessonId, setTargetThumbnailLessonId] = useState<string | null>(null);
  const [editingImageSrc, setEditingImageSrc] = useState<string | null>(null);
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Close popup menus when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuState(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Authentication check & redirect prompt
  useEffect(() => {
    if (status === "unauthenticated") {
      setAuthModalOpen(true);
    }
  }, [status]);

  // Load user lessons from backend
  useEffect(() => {
    if (status === "authenticated") {
      loadLessons();
    }
  }, [status]);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const data = await builderLessonService.getLessons();
      setLessons(data);
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED") {
        setAuthModalOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Create new blank or template lesson
  const handleCreateLesson = async (templateId?: string) => {
    if (status !== "authenticated") {
      setAuthModalOpen(true);
      return;
    }

    setCreating(true);
    try {
      const templateObj = TEMPLATES.find((t) => t.id === templateId);
      let initialTitle = templateObj && templateObj.id !== "t-blank" ? templateObj.name : undefined;

      if (!initialTitle) {
        const existingTitles = lessons.map((l) => l.title);
        initialTitle = getNextUntitledTitle(existingTitles);
      }

      const newLesson = await builderLessonService.createLesson(initialTitle, templateId);
      navigate(`/lesson-builder/${newLesson.id}`);
    } catch (error) {
      console.error("Failed to create lesson", error);
    } finally {
      setCreating(false);
    }
  };

  // Delete lesson
  const handleDeleteLesson = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuState(null);
    try {
      await builderLessonService.deleteLesson(id);
      setLessons((prev) => prev.filter((l) => l.id !== id));
      showToast("Lesson deleted successfully.", "success");
    } catch (error) {
      console.error("Failed to delete lesson", error);
      showToast("Failed to delete lesson.", "error");
    }
  };

  // Toggle publish / unpublish status
  const handleTogglePublishStatus = async (
    id: string,
    currentStatus: "DRAFT" | "PUBLISHED",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setActiveMenuState(null);

    const nextStatus: "DRAFT" | "PUBLISHED" = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const previousLessons = [...lessons];

    // Optimistically update UI
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: nextStatus } : l))
    );

    try {
      await builderLessonService.updateLesson(id, { status: nextStatus });
      showToast(
        nextStatus === "PUBLISHED"
          ? "Lesson published successfully!"
          : "Lesson unpublished (moved to drafts).",
        "success"
      );
    } catch (error: any) {
      console.error("Failed to update lesson status", error);
      setLessons(previousLessons);
      showToast(error?.message || "Failed to update lesson status.", "error");
    }
  };

  // Set or clear single category for a lesson
  const handleSetCategory = async (
    id: string,
    newCategory: string | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setActiveMenuState(null);

    const previousLessons = [...lessons];

    // Optimistically update UI
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, category: newCategory } : l))
    );

    try {
      await builderLessonService.updateLesson(id, { category: newCategory });
      showToast(
        newCategory ? `Category set to "${newCategory}"` : "Category removed.",
        "success"
      );
    } catch (error: any) {
      console.error("Failed to update category", error);
      setLessons(previousLessons);
      showToast(error?.message || "Failed to update category.", "error");
    }
  };

  // Thumbnail Workflow Handlers (Frontend Prototype)
  const handleTriggerAddThumbnail = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuState(null);
    setTargetThumbnailLessonId(lessonId);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, WEBP).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditingImageSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleThumbnailConfirmed = (processedDataUrl: string) => {
    if (targetThumbnailLessonId) {
      setTempThumbnails((prev) => ({
        ...prev,
        [targetThumbnailLessonId]: processedDataUrl,
      }));
    }
    setEditingImageSrc(null);
    setComingSoonModalOpen(true);
  };

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || lesson.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate total slides count across segments
  const getSlidesCount = (lesson: BuilderLessonData) => {
    if (!lesson.segments) return 0;
    return lesson.segments.reduce((acc, seg) => acc + (seg.slides?.length || 0), 0);
  };

  if (status === "loading" || (loading && status === "authenticated")) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-brand-bg flex flex-col items-center justify-center text-brand-text">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="mt-4 font-sans text-brand-secondary text-sm">
          Loading your lesson dashboard...
        </p>
      </div>
    );
  }

  const activeLessonObject = activeMenuState
    ? lessons.find((l) => l.id === activeMenuState.id)
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-2.5 py-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Hidden File Picker Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-surface/60 border border-brand-border p-6 rounded-3xl relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-accent uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Interactive Course Builder</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-text">
            Build Your Own Lessons
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary max-w-xl">
            Design interactive chess courses, position studies, and tactics walkthroughs step-by-step.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => handleCreateLesson()}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-brand-bg font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Create New Lesson</span>
          </button>
        </div>
      </div>

      {/* Templates Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-brand-secondary uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
          Quick Start Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleCreateLesson(tmpl.id)}
              className="p-4 rounded-2xl bg-brand-surface/50 border border-brand-border/60 hover:border-brand-accent/40 hover:bg-brand-surface cursor-pointer transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${tmpl.bgColor}`}>
                  <tmpl.icon className={`w-4 h-4 ${tmpl.color}`} />
                </div>
                <h3 className="font-semibold text-sm text-brand-text group-hover:text-brand-accent transition-colors">
                  {tmpl.name}
                </h3>
              </div>
              <p className="text-xs text-brand-secondary/80 line-clamp-2">
                {tmpl.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lessons Management Feed */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-brand-border/50 pb-4">
          <h2 className="text-lg font-bold text-brand-text">My Lessons</h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-brand-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-brand-surface border border-brand-border/60 rounded-xl text-xs text-brand-text placeholder:text-brand-secondary/50 focus:outline-none focus:border-brand-accent/50 transition-colors w-48 sm:w-60"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-brand-surface p-1 rounded-xl border border-brand-border">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeFilter === "all"
                    ? "bg-brand-accent text-brand-bg shadow-sm"
                    : "text-brand-secondary hover:text-brand-text"
                }`}
              >
                All ({lessons.length})
              </button>
              <button
                onClick={() => setActiveFilter("DRAFT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeFilter === "DRAFT"
                    ? "bg-brand-accent text-brand-bg shadow-sm"
                    : "text-brand-secondary hover:text-brand-text"
                }`}
              >
                Drafts ({lessons.filter((l) => l.status === "DRAFT").length})
              </button>
              <button
                onClick={() => setActiveFilter("PUBLISHED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeFilter === "PUBLISHED"
                    ? "bg-brand-accent text-brand-bg shadow-sm"
                    : "text-brand-secondary hover:text-brand-text"
                }`}
              >
                Published ({lessons.filter((l) => l.status === "PUBLISHED").length})
              </button>
            </div>

            <div className="flex items-center bg-brand-surface p-1 rounded-xl border border-brand-border">
              <button
                onClick={() => setViewMode("grid")}
                title="Grid View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "text-brand-accent bg-brand-accent/15"
                    : "text-brand-secondary hover:text-brand-text"
                }`}
              >
                <GridIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="List View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "text-brand-accent bg-brand-accent/15"
                    : "text-brand-secondary hover:text-brand-text"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Lessons List Grid */}
        {filteredLessons.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-brand-surface/40 border border-dashed border-brand-border/60 space-y-3">
            <Sparkles className="w-8 h-8 text-brand-accent/50 mx-auto" />
            <h3 className="text-base font-semibold text-brand-text">No lessons found</h3>
            <p className="text-xs text-brand-secondary max-w-sm mx-auto">
              {searchQuery
                ? "No lessons match your search query. Try clearing the filter."
                : "You haven't created any lessons yet. Click 'Create New Lesson' to start!"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => {
              const cover = tempThumbnails[lesson.id] || lesson.coverImage;

              return (
                <div
                  key={lesson.id}
                  onClick={() => navigate(`/lesson-builder/${lesson.id}`)}
                  className="group relative rounded-2xl bg-brand-surface border border-brand-border/60 hover:border-brand-accent/50 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  {/* Top Banner Thumbnail (Aspect 16:9 box) */}
                  <div className="h-32 w-full rounded-t-2xl overflow-hidden bg-gradient-to-br from-brand-surface via-brand-bg to-brand-surface p-4 border-b border-brand-border/40 flex items-center justify-between relative">
                    {cover ? (
                      <img
                        src={cover}
                        alt={lesson.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent z-10">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent opacity-60 pointer-events-none" />

                    <div className="flex items-center gap-2 z-10 ml-auto pointer-events-none">
                      {/* Category Tag Badge */}
                      {lesson.category && (
                        <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-brand-accent/20 text-brand-accent border border-brand-accent/30 backdrop-blur-md">
                          {lesson.category}
                        </span>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border backdrop-blur-md ${
                          lesson.status === "PUBLISHED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-brand-accent/20 text-brand-accent border-brand-accent/30"
                        }`}
                      >
                        {lesson.status}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-brand-text group-hover:text-brand-accent transition-colors line-clamp-1">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-brand-secondary mt-1 line-clamp-2 leading-relaxed">
                        {lesson.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-brand-border/30 text-xs text-brand-secondary">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-secondary/70" />
                        <span>
                          {new Date(lesson.updatedAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span>{getSlidesCount(lesson)} slides</span>

                        {/* Options Trigger Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMenuState?.id === lesson.id) {
                              setActiveMenuState(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActiveMenuState({ id: lesson.id, rect });
                            }
                          }}
                          className="p-1 rounded-md hover:bg-brand-text/10 text-brand-secondary hover:text-brand-text transition-colors cursor-pointer"
                          title="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="rounded-2xl border border-brand-border bg-brand-surface divide-y divide-brand-border/40">
            {filteredLessons.map((lesson) => {
              const cover = tempThumbnails[lesson.id] || lesson.coverImage;

              return (
                <div
                  key={lesson.id}
                  onClick={() => navigate(`/lesson-builder/${lesson.id}`)}
                  className="group flex items-center justify-between p-4 hover:bg-brand-bg/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {cover ? (
                      <img
                        src={cover}
                        alt={lesson.title}
                        className="w-12 h-12 rounded-xl object-cover border border-brand-border/60"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-brand-text group-hover:text-brand-accent transition-colors">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-brand-secondary mt-0.5">
                        {getSlidesCount(lesson)} slides • Updated{" "}
                        {new Date(lesson.updatedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Category Tag */}
                    {lesson.category && (
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
                        {lesson.category}
                      </span>
                    )}

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border ${
                        lesson.status === "PUBLISHED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-brand-accent/10 text-brand-accent border-brand-accent/20"
                      }`}
                    >
                      {lesson.status}
                    </span>

                    {/* Options Trigger Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeMenuState?.id === lesson.id) {
                          setActiveMenuState(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveMenuState({ id: lesson.id, rect });
                        }
                      }}
                      className="p-1.5 rounded-lg text-brand-secondary hover:text-brand-text hover:bg-brand-text/10 transition-colors cursor-pointer"
                      title="Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Viewport-Aware Floating Portal Popover Options Menu */}
      {activeMenuState && activeLessonObject && (
        <PortalLessonOptionsMenu
          buttonRect={activeMenuState.rect}
          lesson={activeLessonObject}
          onAddThumbnail={(e) => handleTriggerAddThumbnail(activeLessonObject.id, e)}
          onTogglePublish={(e) => handleTogglePublishStatus(activeLessonObject.id, activeLessonObject.status, e)}
          onSetCategory={(cat, e) => handleSetCategory(activeLessonObject.id, cat, e)}
          onDelete={(e) => handleDeleteLesson(activeLessonObject.id, e)}
          onClose={() => setActiveMenuState(null)}
        />
      )}

      {/* Image Editor Modal */}
      {editingImageSrc && (
        <ThumbnailEditorModal
          imageSrc={editingImageSrc}
          onConfirm={handleThumbnailConfirmed}
          onClose={() => setEditingImageSrc(null)}
        />
      )}

      {/* Thumbnail Upload Coming Soon Modal */}
      {comingSoonModalOpen && (
        <ThumbnailComingSoonModal
          onClose={() => setComingSoonModalOpen(false)}
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

      {/* Auth Modal for Non-Authenticated Users */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
}
