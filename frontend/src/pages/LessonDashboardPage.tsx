import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useSession } from "../hooks/useSession";
import {
  builderLessonService,
  type BuilderLessonData,
} from "../services/builderLesson.service";
import { AuthModal } from "../components/AuthModal";
import { getNextUntitledTitle } from "../utils/lessonNaming";

const TEMPLATES = [
  {
    id: "t-blank",
    name: "Blank Lesson",
    description: "Start from scratch with a blank sheet and board.",
    icon: Plus,
    color: "text-brand-accent",
    bg: "bg-brand-accent/10",
  },
];

export default function LessonDashboardPage() {
  const { status } = useSession();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState<BuilderLessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "DRAFT" | "PUBLISHED">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
    setActiveMenuId(null);
    try {
      await builderLessonService.deleteLesson(id);
      setLessons(lessons.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Failed to delete lesson", error);
    }
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
          Loading your lesson library...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-bg text-brand-text font-sans p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/40 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-text">
                  Build Your Own Lessons
                </h1>
                <p className="text-brand-secondary text-sm mt-1">
                  Create, structure, and edit interactive chess lessons for your students and audience.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleCreateLesson("t-blank")}
            disabled={creating}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent text-brand-bg font-medium hover:bg-brand-accent-hover shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Create New Lesson</span>
          </button>
        </div>

        {/* Templates Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-secondary">
            Start from a Template
          </h2>

          <div className="max-w-md w-full">
            {TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleCreateLesson(tmpl.id)}
                  className="group p-5 rounded-2xl bg-brand-surface border border-brand-border/60 hover:border-brand-accent/50 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${tmpl.bg} flex items-center justify-center ${tmpl.color} transition-transform group-hover:scale-105`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-brand-text group-hover:text-brand-accent transition-colors">
                        {tmpl.name}
                      </h3>
                      <p className="text-brand-secondary text-xs mt-1 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-brand-border/30 flex items-center gap-1.5 text-xs text-brand-accent font-medium">
                    <span>Create Template</span>
                    <Plus className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lessons..."
              className="w-full pl-10 pr-4 py-2 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-text placeholder-brand-secondary/60 outline-none focus:border-brand-accent/50 transition-colors"
            />
          </div>

          {/* Filter Tabs & View Toggle */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
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
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => navigate(`/lesson-builder/${lesson.id}`)}
                className="group relative rounded-2xl bg-brand-surface border border-brand-border/60 hover:border-brand-accent/50 shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                {/* Top Banner Thumbnail */}
                <div className="h-32 w-full bg-gradient-to-br from-brand-surface via-brand-bg to-brand-surface p-4 border-b border-brand-border/40 flex items-center justify-between relative overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                    <BookOpen className="w-6 h-6" />
                  </div>

                  <span
                    className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border ${
                      lesson.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-brand-accent/10 text-brand-accent border-brand-accent/20"
                    }`}
                  >
                    {lesson.status}
                  </span>
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

                      {/* Options Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === lesson.id ? null : lesson.id);
                          }}
                          className="p-1 rounded-md hover:bg-brand-text/10 text-brand-secondary hover:text-brand-text transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === lesson.id && (
                          <div className="absolute right-0 bottom-full mb-1 w-36 bg-brand-surface border border-brand-border rounded-xl shadow-xl p-1 z-30">
                            <button
                              onClick={(e) => handleDeleteLesson(lesson.id, e)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="rounded-2xl border border-brand-border bg-brand-surface divide-y divide-brand-border/40 overflow-hidden">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => navigate(`/lesson-builder/${lesson.id}`)}
                className="group flex items-center justify-between p-4 hover:bg-brand-bg/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                    <BookOpen className="w-5 h-5" />
                  </div>
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

                <div className="flex items-center gap-4">
                  <span
                    className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border ${
                      lesson.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-brand-accent/10 text-brand-accent border-brand-accent/20"
                    }`}
                  >
                    {lesson.status}
                  </span>

                  <button
                    onClick={(e) => handleDeleteLesson(lesson.id, e)}
                    title="Delete Lesson"
                    className="p-1.5 rounded-lg text-brand-secondary hover:text-red-400 hover:bg-brand-text/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auth Modal for Non-Authenticated Users */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
}
