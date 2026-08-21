import { useState, useEffect, useCallback } from "react";
import { X, Search, SlidersHorizontal, ChevronRight, AlertCircle } from "lucide-react";
import { PuzzleApiService } from "@/features/puzzles/puzzle.service";
import type { PuzzleFilters } from "@/features/puzzles/puzzle.types";

interface CustomPuzzlePanelProps {
  onStart: (filters: PuzzleFilters) => void;
  onClose: () => void;
}

const RATING_MIN = 400;
const RATING_MAX = 3000;
const RATING_STEP = 100;

function snapRating(val: number): number {
  const rounded = Math.round(val / RATING_STEP) * RATING_STEP;
  return Math.min(RATING_MAX, Math.max(RATING_MIN, rounded));
}

function getRatingValidationError(minStr: string, maxStr: string): string | null {
  if (!minStr.trim() || !maxStr.trim()) {
    return "Please enter ratings between 400 and 3000.";
  }
  const minVal = Number(minStr);
  const maxVal = Number(maxStr);

  if (isNaN(minVal) || isNaN(maxVal)) {
    return "Please enter valid rating numbers.";
  }
  if (minVal < RATING_MIN || minVal > RATING_MAX) {
    return `Minimum rating must be between ${RATING_MIN} and ${RATING_MAX}.`;
  }
  if (maxVal < RATING_MIN || maxVal > RATING_MAX) {
    return `Maximum rating must be between ${RATING_MIN} and ${RATING_MAX}.`;
  }
  if (minVal % RATING_STEP !== 0) {
    return `Ratings must be in multiples of 100 (e.g. ${snapRating(minVal)}).`;
  }
  if (maxVal % RATING_STEP !== 0) {
    return `Ratings must be in multiples of 100 (e.g. ${snapRating(maxVal)}).`;
  }
  if (minVal > maxVal) {
    return "Min rating cannot be higher than max rating.";
  }
  return null;
}

// Human-readable labels for Lichess theme tags
const THEME_LABELS: Record<string, string> = {
  mate: "Checkmate",
  mateIn1: "Mate in 1",
  mateIn2: "Mate in 2",
  mateIn3: "Mate in 3",
  mateIn4: "Mate in 4",
  mateIn5: "Mate in 5+",
  oneMove: "One Move",
  short: "Short",
  long: "Long",
  middlegame: "Middlegame",
  endgame: "Endgame",
  opening: "Opening",
  advantage: "Advantage",
  crushing: "Crushing",
  fork: "Fork",
  pin: "Pin",
  skewer: "Skewer",
  discoveredAttack: "Discovered Attack",
  doubleCheck: "Double Check",
  sacrifice: "Sacrifice",
  deflection: "Deflection",
  decoy: "Decoy",
  clearance: "Clearance",
  interference: "Interference",
  quietMove: "Quiet Move",
  zwischenzug: "Zwischenzug",
  zugzwang: "Zugzwang",
  exposedKing: "Exposed King",
  kingsideAttack: "Kingside Attack",
  queensideAttack: "Queenside Attack",
  attackingF2F7: "Attack on f2/f7",
  backRankMate: "Back Rank Mate",
  bodensMate: "Boden's Mate",
  doubleBishopMate: "Double Bishop Mate",
  dovetailMate: "Dovetail Mate",
  hookMate: "Hook Mate",
  operaMate: "Opera Mate",
  pillsburysMate: "Pillsbury's Mate",
  smotheredMate: "Smothered Mate",
  xRayAttack: "X-Ray Attack",
  promotion: "Promotion",
  underPromotion: "Underpromotion",
  castling: "Castling",
  enPassant: "En Passant",
  trappedPiece: "Trapped Piece",
  hangingPiece: "Hanging Piece",
  master: "Master Game",
  superGM: "Super GM",
  equality: "Equality",
  vuković: "Vuković Mate",
};

function getThemeLabel(tag: string): string {
  return (
    THEME_LABELS[tag] ??
    tag.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
  );
}

export function CustomPuzzlePanel({
  onStart,
  onClose,
}: CustomPuzzlePanelProps) {
  const [themes, setThemes] = useState<string[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [minRatingStr, setMinRatingStr] = useState("400");
  const [maxRatingStr, setMaxRatingStr] = useState("2000");
  const [themeSearch, setThemeSearch] = useState("");
  const [starting, setStarting] = useState(false);

  const ratingError = getRatingValidationError(minRatingStr, maxRatingStr);

  // Fetch themes once on mount
  useEffect(() => {
    async function fetchThemes() {
      setLoadingThemes(true);
      try {
        const data = await PuzzleApiService.getThemes();
        setThemes(data);
      } catch {
        // Backend unavailable — panel stays usable with an empty list
      } finally {
        setLoadingThemes(false);
      }
    }
    fetchThemes();
  }, []);

  const toggleTheme = useCallback((theme: string) => {
    setSelectedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(theme)) {
        next.delete(theme);
      } else {
        next.add(theme);
      }
      return next;
    });
  }, []);

  const toggleAllThemes = useCallback(() => {
    if (selectedThemes.size === themes.length) {
      setSelectedThemes(new Set());
    } else {
      setSelectedThemes(new Set(themes));
    }
  }, [selectedThemes, themes]);

  const handleMinBlur = () => {
    let minVal = parseInt(minRatingStr, 10);
    if (isNaN(minVal)) minVal = RATING_MIN;
    const snappedMin = snapRating(minVal);

    let maxVal = parseInt(maxRatingStr, 10);
    if (isNaN(maxVal)) maxVal = RATING_MAX;
    let snappedMax = snapRating(maxVal);

    if (snappedMin > snappedMax) {
      snappedMax = snappedMin;
    }

    setMinRatingStr(snappedMin.toString());
    setMaxRatingStr(snappedMax.toString());
  };

  const handleMaxBlur = () => {
    let maxVal = parseInt(maxRatingStr, 10);
    if (isNaN(maxVal)) maxVal = RATING_MAX;
    const snappedMax = snapRating(maxVal);

    let minVal = parseInt(minRatingStr, 10);
    if (isNaN(minVal)) minVal = RATING_MIN;
    let snappedMin = snapRating(minVal);

    if (snappedMin > snappedMax) {
      snappedMin = snappedMax;
    }

    setMinRatingStr(snappedMin.toString());
    setMaxRatingStr(snappedMax.toString());
  };

  const handleStart = useCallback(async () => {
    const minVal = parseInt(minRatingStr, 10);
    const maxVal = parseInt(maxRatingStr, 10);
    const err = getRatingValidationError(minRatingStr, maxRatingStr);
    if (err || isNaN(minVal) || isNaN(maxVal)) return;

    setStarting(true);
    const filters: PuzzleFilters = {
      themes: selectedThemes.size > 0 ? Array.from(selectedThemes) : undefined,
      minRating: minVal,
      maxRating: maxVal,
      limit: 50,
    };
    onStart(filters);
    setStarting(false);
  }, [selectedThemes, minRatingStr, maxRatingStr, onStart]);

  const filteredThemes = themes.filter((t) =>
    getThemeLabel(t).toLowerCase().includes(themeSearch.toLowerCase()),
  );

  const allSelected =
    themes.length > 0 && selectedThemes.size === themes.length;

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden w-full h-full max-h-[685px] bg-brand-surface border border-brand-border text-brand-text transition-colors duration-200"
      style={{
        boxShadow: "none",
      }}
    >
      {/* Ambient glow top-right */}
      <div
        className="absolute top-0 right-0 w-40 h-40 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at top right, var(--gold-whisper) 0%, transparent 70%)",
        }}
      />

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-brand-border/60"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-accent/10 border border-brand-accent/20"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-accent" />
          </div>
          <div>
            <h2
              className="text-base font-semibold tracking-wide font-serif text-brand-text"
            >
              Custom Puzzles
            </h2>
            <p
              className="text-[10px] mt-0.5 text-brand-secondary font-sans"
            >
              Filter by theme &amp; rating range
            </p>
          </div>
        </div>

        {/* Close — returns to pathway */}
        <button
          onClick={onClose}
          aria-label="Back to pathway"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer bg-brand-text/5 border border-brand-border/40 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 overflow-hidden px-5 py-4 gap-4">
        {/* Rating Range */}
        <div>
          <div className="flex items-baseline justify-between mb-2.5">
            <label
              className="text-[10px] font-mono uppercase tracking-widest text-brand-secondary"
            >
              Rating Range
            </label>
            <span className="text-[9px] font-sans text-brand-secondary/50 tracking-wide">
              400 – 3000 · steps of 100
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                id="panel-puzzle-min-rating"
                type="number"
                value={minRatingStr}
                min={RATING_MIN}
                max={RATING_MAX}
                step={RATING_STEP}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setMinRatingStr(cleaned);
                }}
                onBlur={handleMinBlur}
                className={`w-full text-sm font-mono text-center transition-all duration-200 outline-none rounded-xl py-2 px-3 bg-brand-bg/80 text-brand-text ring-1 ${
                  ratingError
                    ? "ring-amber-500/80 focus:ring-amber-400"
                    : "ring-brand-accent/15 focus:ring-brand-accent/50"
                }`}
              />
            </div>
            <span className="text-brand-secondary text-lg">—</span>
            <div className="flex-1">
              <input
                id="panel-puzzle-max-rating"
                type="number"
                value={maxRatingStr}
                min={RATING_MIN}
                max={RATING_MAX}
                step={RATING_STEP}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setMaxRatingStr(cleaned);
                }}
                onBlur={handleMaxBlur}
                className={`w-full text-sm font-mono text-center transition-all duration-200 outline-none rounded-xl py-2 px-3 bg-brand-bg/80 text-brand-text ring-1 ${
                  ratingError
                    ? "ring-amber-500/80 focus:ring-amber-400"
                    : "ring-brand-accent/15 focus:ring-brand-accent/50"
                }`}
              />
            </div>
          </div>
          {ratingError && (
            <div className="mt-2 text-xs font-sans text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
              <span>{ratingError}</span>
            </div>
          )}
        </div>

        {/* Theme Search */}
        <div className="flex flex-col flex-1 overflow-hidden gap-0">
          <div className="flex items-center justify-between mb-2.5">
            <label
              className="text-[10px] font-mono uppercase tracking-widest text-brand-secondary"
            >
              Select Theme(s)
            </label>
            {selectedThemes.size > 0 && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent"
              >
                {selectedThemes.size} selected
              </span>
            )}
          </div>

          {/* Search input */}
          <div className="relative mb-2.5">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-brand-secondary/70"
            />
            <input
              id="panel-puzzle-theme-search"
              type="text"
              placeholder="Search themes…"
              value={themeSearch}
              onChange={(e) => setThemeSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 outline-none transition-all duration-200 rounded-full bg-brand-bg/80 ring-1 ring-brand-accent/15 focus:ring-brand-accent/50 text-brand-text placeholder:text-brand-secondary/50"
            />
          </div>

          {/* Theme list */}
          <div
            className="overflow-y-auto rounded-xl flex-1 bg-brand-bg/60 min-h-[140px] max-h-[300px]"
          >
            {loadingThemes ? (
              <div className="flex items-center justify-center py-10">
                <div
                  className="w-5 h-5 rounded-full border-2 animate-spin border-brand-accent/20 border-t-brand-accent"
                />
              </div>
            ) : (
              <>
                {/* All Themes row */}
                {!themeSearch && (
                  <button
                    onClick={toggleAllThemes}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 cursor-pointer border-b border-brand-border/10 hover:bg-brand-accent/5"
                    style={{
                      background: allSelected
                        ? "var(--gold-whisper)"
                        : "transparent",
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center border transition-all duration-150"
                      style={{
                        borderColor: allSelected
                          ? "var(--gold-bright)"
                          : "var(--marble-border)",
                        background: allSelected
                          ? "var(--gold-whisper)"
                          : "transparent",
                      }}
                    >
                      {allSelected && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path
                            d="M1 3.5L3.5 6L8 1"
                            stroke="var(--gold-bright)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className="text-xs font-medium flex-1 font-sans"
                      style={{
                        color: allSelected ? "var(--gold-bright)" : "var(--text-primary)",
                      }}
                    >
                      All Themes
                    </span>
                  </button>
                )}

                {/* Individual themes */}
                {filteredThemes.map((theme) => {
                  const checked = selectedThemes.has(theme);
                  return (
                    <button
                      key={theme}
                      onClick={() => toggleTheme(theme)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 cursor-pointer hover:bg-brand-accent/5"
                      style={{
                        background: checked
                          ? "var(--gold-whisper)"
                          : "transparent",
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center border transition-all duration-150"
                        style={{
                          borderColor: checked
                            ? "var(--gold-bright)"
                            : "var(--marble-border)",
                          background: checked
                            ? "var(--gold-whisper)"
                            : "transparent",
                        }}
                      >
                        {checked && (
                          <svg
                            width="9"
                            height="7"
                            viewBox="0 0 9 7"
                            fill="none"
                          >
                            <path
                              d="M1 3.5L3.5 6L8 1"
                              stroke="var(--gold-bright)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className="text-xs flex-1 font-sans"
                        style={{
                          color: checked ? "var(--gold-bright)" : "var(--text-secondary)",
                        }}
                      >
                        {getThemeLabel(theme)}
                      </span>
                    </button>
                  );
                })}

                {filteredThemes.length === 0 && !loadingThemes && (
                  <div
                    className="py-8 text-center text-xs text-brand-secondary font-sans"
                  >
                    No themes matching "{themeSearch}"
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer / Start button ── */}
      <div
        className="px-5 pb-5 pt-3 flex-shrink-0 border-t border-brand-border/40"
      >
        <button
          id="panel-puzzle-start-btn"
          onClick={handleStart}
          disabled={starting || !!ratingError}
          className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed btn-premium-cta cta-shine"
        >
          {starting ? (
            <>
              <div
                className="w-3.5 h-3.5 rounded-full border-2 animate-spin border-current border-t-transparent"
              />
              Loading…
            </>
          ) : (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              Start Session
            </>
          )}
        </button>

        {selectedThemes.size === 0 && !starting && (
          <p
            className="text-center text-[10px] mt-1.5 text-brand-secondary font-sans"
          >
            No theme selected — all themes will be included
          </p>
        )}
      </div>
    </div>
  );
}

