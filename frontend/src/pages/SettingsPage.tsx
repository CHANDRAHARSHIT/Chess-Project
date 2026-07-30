/**
 * SettingsPage.tsx
 *
 * Site settings, modeled after chess.com's Settings screen
 * (https://www.chess.com/settings) — left-hand category list, right-hand
 * content panel with tabs.
 */
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Search,
  Grid3x3,
  Gamepad2,
  Monitor,
  Bell,
  CircleUserRound,
  CreditCard,
  Check,
} from "lucide-react";
import { useBoardSettings } from "../hooks/useBoardSettings";
import { BOARD_THEMES } from "../data/boardThemes";
import { PIECE_SETS } from "../data/pieceSets";
import BoardPreview from "../components/BoardPreview";
import ProfileContent from "../components/ProfileContent";
import { soundManager } from "../utils/SoundManager";
import { useNavigationStack } from "../hooks/useNavigationStack";

type TabId = "boards" | "pieces" | "background" | "presets";

interface SettingsTab {
  id: TabId;
  name: string;
  available: boolean;
}

const TABS: SettingsTab[] = [
  { id: "boards", name: "Boards", available: true },
  { id: "pieces", name: "Pieces", available: true },
  { id: "background", name: "Background", available: false },
  { id: "presets", name: "Presets", available: false },
];

interface SettingsCategory {
  id: string;
  name: string;
  icon: typeof Grid3x3;
  available: boolean;
  /** Route this category navigates to. Omitted for categories that render
   *  their content inline within this page (currently Board & Pieces and Profile). */
  path?: string;
}

const CATEGORIES: SettingsCategory[] = [
  {
    id: "board-pieces",
    name: "Board & Pieces",
    icon: Grid3x3,
    available: true,
  },
  { id: "profile", name: "Profile", icon: CircleUserRound, available: true },
  {
    id: "membership",
    name: "Membership",
    icon: CreditCard,
    available: true,
    path: "/pricing",
  },
  { id: "gameplay", name: "Gameplay", icon: Gamepad2, available: false },
  { id: "interface", name: "Interface", icon: Monitor, available: false },
  { id: "notifications", name: "Notifications", icon: Bell, available: false },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { push } = useNavigationStack();
  const { boardTheme, pieceSet, setBoardThemeId, setPieceSetId } =
    useBoardSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Derive active category and tab directly from URL params ────────────────
  // Category: ?cat=board-pieces (default) or ?cat=profile
  const activeCategory = CATEGORIES.some((c) => c.id === searchParams.get("cat"))
    ? searchParams.get("cat")!
    : "board-pieces";

  // Sub-tab within Board & Pieces: ?tab=boards (default) or ?tab=pieces
  const VALID_TABS: TabId[] = TABS.filter((t) => t.available).map((t) => t.id);
  const activeTab: TabId = VALID_TABS.includes(searchParams.get("tab") as TabId)
    ? (searchParams.get("tab") as TabId)
    : "boards";

  const [searchQuery, setSearchQuery] = useState("");

  // Changes are staged locally and pushed into BoardSettingsContext
  // (and localStorage) only when the player clicks "Save".
  const [pendingBoardThemeId, setPendingBoardThemeId] = useState(boardTheme.id);
  const [pendingPieceSetId, setPendingPieceSetId] = useState(pieceSet.id);
  const [justSaved, setJustSaved] = useState(false);

  const pendingTheme =
    BOARD_THEMES.find((t) => t.id === pendingBoardThemeId) ?? boardTheme;
  const pendingPieceSet =
    PIECE_SETS.find((p) => p.id === pendingPieceSetId) ?? pieceSet;

  const hasChanges =
    pendingBoardThemeId !== boardTheme.id || pendingPieceSetId !== pieceSet.id;

  const filteredCategories = CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const handleSave = () => {
    setBoardThemeId(pendingBoardThemeId);
    setPieceSetId(pendingPieceSetId);
    soundManager.playButtonClick();
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2200);
  };

  const handleCancel = () => {
    setPendingBoardThemeId(boardTheme.id);
    setPendingPieceSetId(pieceSet.id);
    soundManager.playButtonClick();
  };

  return (
    <div className="min-h-screen text-brand-text flex flex-col bg-transparent selection:bg-brand-accent selection:text-brand-text">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16 relative z-10 flex flex-col gap-6">
        {/* Back link */}
        <div className="mt-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Play
          </button>
        </div>

        {/* Page heading */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent shrink-0">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-text tracking-wide">
            Settings
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-8">
          {/* ── LEFT: search + category nav ─────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary/50 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Settings"
                className="w-full bg-brand-text/5 border border-[rgba(212,175,110,0.40)] rounded-lg pl-9 pr-3 py-2 text-sm font-sans text-brand-text placeholder:text-brand-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-accent/50 focus:border-brand-accent/50 transition-colors"
              />
            </div>

            <nav
              className="flex flex-col gap-1"
              aria-label="Settings categories"
            >
              {filteredCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = cat.id === activeCategory;

                if (!cat.available) {
                  return (
                    <div
                      key={cat.id}
                      title="Coming Soon"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-brand-secondary/35 cursor-not-allowed select-none"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-sans flex-1">
                        {cat.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-[rgba(212,175,110,0.30)] text-brand-secondary/40">
                        Soon
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      soundManager.playButtonClick();
                      if (cat.path) {
                        if (cat.path === "/pricing") {
                          push({
                            label: "Settings",
                            path: "/settings",
                          });
                        }
                        navigate(cat.path);
                      } else {
                        // Push a new history entry so the browser Back button
                        // returns to the previous category.
                        setSearchParams(
                          cat.id === "board-pieces"
                            ? { cat: cat.id, tab: activeTab }
                            : { cat: cat.id },
                        );
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 cursor-pointer ${isActive
                      ? "bg-brand-accent/10 text-brand-accent font-medium ring-1 ring-brand-accent/30"
                      : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/5"
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-sans flex-1">{cat.name}</span>
                  </button>
                );
              })}
              {filteredCategories.length === 0 && (
                <p className="text-xs font-sans text-brand-secondary/50 px-3 py-2">
                  No settings match "{searchQuery}".
                </p>
              )}
            </nav>
          </div>

          {/* ── RIGHT: Board & Pieces panel or Profile Content ──────────── */}
          {activeCategory === "board-pieces" ? (
            <div className="bg-brand-surface/30 border border-[rgba(212,175,110,0.40)] rounded-2xl p-5 sm:p-7">
              <h2 className="text-xl font-display font-bold text-brand-text tracking-wide">
                Board & Pieces
              </h2>
              <p className="text-sm font-sans text-brand-secondary/70 mt-1">
                Customize the look and feel of your chess set.
              </p>

              {/* Tabs */}
              <div className="flex items-center gap-6 border-b border-[rgba(212,175,110,0.30)] mt-6 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => {
                  if (!tab.available) {
                    return (
                      <div
                        key={tab.id}
                        title="Coming Soon"
                        className="pb-3 text-sm font-sans font-medium text-brand-secondary/30 cursor-not-allowed flex items-center gap-1.5 select-none whitespace-nowrap"
                      >
                        {tab.name}
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-[rgba(212,175,110,0.30)] text-brand-secondary/40">
                          Soon
                        </span>
                      </div>
                    );
                  }

                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        soundManager.playButtonClick();
                        // Replace the current history entry — sub-tab changes
                        // within a category shouldn't flood the back-stack.
                        setSearchParams(
                          { cat: "board-pieces", tab: tab.id },
                          { replace: true },
                        );
                      }}
                      className={`relative pb-3 text-sm font-sans font-semibold transition-colors cursor-pointer whitespace-nowrap ${isActive
                        ? "text-brand-text"
                        : "text-brand-secondary hover:text-brand-text"
                        }`}
                    >
                      {tab.name}
                      {isActive && (
                        <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-accent rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab content + live preview */}
              <div className="flex flex-col lg:flex-row gap-8 mt-6">
                <div className="flex-1">
                  {activeTab === "boards" && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {BOARD_THEMES.map((theme) => {
                        const isSelected = theme.id === pendingBoardThemeId;
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => {
                              soundManager.playButtonClick();
                              setPendingBoardThemeId(theme.id);
                            }}
                            className={`group relative flex flex-col items-center gap-2 rounded-xl p-2.5 transition-all duration-150 cursor-pointer ${isSelected
                              ? "ring-2 ring-brand-accent bg-brand-accent/5"
                              : "ring-1 ring-brand-border/40 hover:ring-brand-border/80 hover:bg-brand-text/[0.03]"
                              }`}
                          >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 shadow-inner shadow-black/30">
                              <div style={{ backgroundColor: theme.light }} />
                              <div style={{ backgroundColor: theme.dark }} />
                              <div style={{ backgroundColor: theme.dark }} />
                              <div style={{ backgroundColor: theme.light }} />
                            </div>
                            <span className="text-xs font-sans text-brand-secondary group-hover:text-brand-text transition-colors">
                              {theme.name}
                            </span>
                            {isSelected && (
                              <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-brand-accent flex items-center justify-center shadow-md shadow-black/40">
                                <Check
                                  className="w-3 h-3 text-brand-bg"
                                  strokeWidth={3}
                                />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === "pieces" && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {PIECE_SETS.map((set) => {
                        const isSelected = set.id === pendingPieceSetId;
                        return (
                          <button
                            key={set.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => {
                              soundManager.playButtonClick();
                              setPendingPieceSetId(set.id);
                            }}
                            className={`group relative flex flex-col items-center gap-2 rounded-xl p-2.5 transition-all duration-150 cursor-pointer ${isSelected
                              ? "ring-2 ring-brand-accent bg-brand-accent/5"
                              : "ring-1 ring-brand-border/40 hover:ring-brand-border/80 hover:bg-brand-text/[0.03]"
                              }`}
                          >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-[#4d4536] flex items-center justify-center gap-1.5 p-2">
                              <div className="w-6 h-6 sm:w-7 sm:h-7">
                                {set.pieces.bK()}
                              </div>
                              <div className="w-6 h-6 sm:w-7 sm:h-7">
                                {set.pieces.wK()}
                              </div>
                            </div>
                            <span className="text-xs font-sans text-brand-secondary group-hover:text-brand-text transition-colors">
                              {set.name}
                            </span>
                            {isSelected && (
                              <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-brand-accent flex items-center justify-center shadow-md shadow-black/40">
                                <Check
                                  className="w-3 h-3 text-brand-bg"
                                  strokeWidth={3}
                                />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Live preview */}
                <div className="flex flex-col items-center gap-2 lg:items-end shrink-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-brand-secondary/50 self-center lg:self-end">
                    Preview
                  </span>
                  <BoardPreview
                    size={220}
                    theme={pendingTheme}
                    pieceSet={pendingPieceSet}
                  />
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-[rgba(212,175,110,0.20)]">
                {justSaved && (
                  <span className="text-xs font-sans font-semibold text-emerald-400 flex items-center gap-1.5 mr-auto">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={!hasChanges}
                  className="px-5 py-2.5 rounded-xl font-sans text-sm font-semibold bg-brand-text/5 border border-white/10 text-brand-secondary hover:text-brand-text hover:border-white/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="px-6 py-2.5 rounded-xl font-sans text-sm font-bold btn-premium-cta cta-shine cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <ProfileContent />
          )}
        </div>
      </main>
    </div>
  );
}
