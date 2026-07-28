import { useState, useEffect, useCallback } from "react";
import { X, Search, Sparkles, ChevronRight } from "lucide-react";
import { PuzzleApiService } from "../services/puzzle.service";
import type { PuzzleFilters } from "../types/puzzle";

interface CustomPuzzlePanelProps {
  onStart: (filters: PuzzleFilters) => void;
  onClose: () => void;
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
  capturingDefender: "Capturing Defender",
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
  const [minRating, setMinRating] = useState(600);
  const [maxRating, setMaxRating] = useState(2000);
  const [themeSearch, setThemeSearch] = useState("");
  const [starting, setStarting] = useState(false);

  // Fetch themes once on mount
  useEffect(() => {
    setLoadingThemes(true);
    PuzzleApiService.getThemes().then((data) => {
      setThemes(data);
      setLoadingThemes(false);
    });
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

  const handleStart = useCallback(async () => {
    setStarting(true);
    const filters: PuzzleFilters = {
      themes: selectedThemes.size > 0 ? Array.from(selectedThemes) : undefined,
      minRating,
      maxRating,
      limit: 50,
    };
    onStart(filters);
    setStarting(false);
  }, [selectedThemes, minRating, maxRating, onStart]);

  const filteredThemes = themes.filter((t) =>
    getThemeLabel(t).toLowerCase().includes(themeSearch.toLowerCase()),
  );

  const allSelected =
    themes.length > 0 && selectedThemes.size === themes.length;

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden shadow-2xl w-full h-full max-h-[685px]"
      style={{
        background: "linear-gradient(160deg, #0C1020 0%, #0a0e1a 100%)",
        border: "1px solid rgba(212, 175, 110, 0.18)",
        boxShadow:
          "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,110,0.06)",
      }}
    >
      {/* Ambient glow top-right */}
      <div
        className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(212,175,110,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(212, 175, 110, 0.12)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(212, 175, 110, 0.1)",
              border: "1px solid rgba(212, 175, 110, 0.2)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#D4AF6E" }} />
          </div>
          <div>
            <h2
              className="text-base font-semibold tracking-wide"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "#F5F0E8",
              }}
            >
              Custom Puzzles
            </h2>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: "#8E8B82", fontFamily: "Inter, sans-serif" }}
            >
              Filter by theme &amp; rating range
            </p>
          </div>
        </div>

        {/* Close — returns to pathway */}
        <button
          onClick={onClose}
          aria-label="Back to pathway"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#8E8B82",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#F5F0E8";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(212,175,110,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#8E8B82";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(255,255,255,0.08)";
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 overflow-hidden px-5 py-4 gap-4">
        {/* Rating Range */}
        <div>
          <label
            className="block text-[10px] font-mono uppercase tracking-widest mb-2.5"
            style={{ color: "#8E8B82" }}
          >
            Rating Range
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                id="panel-puzzle-min-rating"
                type="number"
                value={minRating}
                min={400}
                max={maxRating - 100}
                step={50}
                onChange={(e) =>
                  setMinRating(Math.max(400, parseInt(e.target.value) || 400))
                }
                className="w-full text-sm font-mono text-center transition-all duration-200 outline-none"
                style={{
                  background: "rgba(8, 11, 20, 0.8)",
                  border: "1px solid rgba(212, 175, 110, 0.2)",
                  borderRadius: "10px",
                  padding: "7px 10px",
                  color: "#F5F0E8",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(212,175,110,0.5)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 2px rgba(212,175,110,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(212,175,110,0.2)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <span style={{ color: "#5C5954", fontSize: "18px" }}>—</span>
            <div className="flex-1">
              <input
                id="panel-puzzle-max-rating"
                type="number"
                value={maxRating}
                min={minRating + 100}
                max={3000}
                step={50}
                onChange={(e) =>
                  setMaxRating(Math.min(3000, parseInt(e.target.value) || 3000))
                }
                className="w-full text-sm font-mono text-center transition-all duration-200 outline-none"
                style={{
                  background: "rgba(8, 11, 20, 0.8)",
                  border: "1px solid rgba(212, 175, 110, 0.2)",
                  borderRadius: "10px",
                  padding: "7px 10px",
                  color: "#F5F0E8",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(212,175,110,0.5)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 2px rgba(212,175,110,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(212,175,110,0.2)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>
        </div>

        {/* Theme Search */}
        <div className="flex flex-col flex-1 overflow-hidden gap-0">
          <div className="flex items-center justify-between mb-2.5">
            <label
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: "#8E8B82" }}
            >
              Select Theme(s)
            </label>
            {selectedThemes.size > 0 && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(212, 175, 110, 0.1)",
                  border: "1px solid rgba(212, 175, 110, 0.25)",
                  color: "#D4AF6E",
                }}
              >
                {selectedThemes.size} selected
              </span>
            )}
          </div>

          {/* Search input */}
          <div className="relative mb-2.5">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
              style={{ color: "#5C5954" }}
            />
            <input
              id="panel-puzzle-theme-search"
              type="text"
              placeholder="Search themes…"
              value={themeSearch}
              onChange={(e) => setThemeSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 outline-none transition-all duration-200"
              style={{
                background: "rgba(8, 11, 20, 0.6)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "10px",
                color: "#F5F0E8",
                fontFamily: "Inter, sans-serif",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,175,110,0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
              }}
            />
          </div>

          {/* Theme list */}
          <div
            className="overflow-y-auto rounded-xl flex-1"
            style={{
              background: "rgba(8, 11, 20, 0.5)",
              border: "1px solid rgba(255,255,255,0.06)",
              minHeight: "140px",
              maxHeight: "300px",
            }}
          >
            {loadingThemes ? (
              <div className="flex items-center justify-center py-10">
                <div
                  className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: "rgba(212,175,110,0.2)",
                    borderTopColor: "#D4AF6E",
                  }}
                />
              </div>
            ) : (
              <>
                {/* All Themes row */}
                {!themeSearch && (
                  <button
                    onClick={toggleAllThemes}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 cursor-pointer"
                    style={{
                      background: allSelected
                        ? "rgba(212, 175, 110, 0.08)"
                        : "transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                    onMouseEnter={(e) => {
                      if (!allSelected)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,255,255,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      if (!allSelected)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                      style={{
                        border: allSelected
                          ? "1.5px solid #D4AF6E"
                          : "1.5px solid rgba(255,255,255,0.2)",
                        background: allSelected
                          ? "rgba(212,175,110,0.15)"
                          : "transparent",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {allSelected && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path
                            d="M1 3.5L3.5 6L8 1"
                            stroke="#D4AF6E"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className="text-xs font-medium flex-1"
                      style={{
                        color: allSelected ? "#D4AF6E" : "#F5F0E8",
                        fontFamily: "Inter, sans-serif",
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
                      className="w-full flex items-center gap-3 px-4 py-2 text-left transition-all duration-150 cursor-pointer"
                      style={{
                        background: checked
                          ? "rgba(212, 175, 110, 0.06)"
                          : "transparent",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                      onMouseEnter={(e) => {
                        if (!checked)
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "rgba(255,255,255,0.025)";
                      }}
                      onMouseLeave={(e) => {
                        if (!checked)
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "transparent";
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                        style={{
                          border: checked
                            ? "1.5px solid #D4AF6E"
                            : "1.5px solid rgba(255,255,255,0.18)",
                          background: checked
                            ? "rgba(212,175,110,0.12)"
                            : "transparent",
                          transition: "all 0.15s ease",
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
                              stroke="#D4AF6E"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className="text-xs flex-1"
                        style={{
                          color: checked ? "#D4AF6E" : "#C5BFB5",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {getThemeLabel(theme)}
                      </span>
                    </button>
                  );
                })}

                {filteredThemes.length === 0 && !loadingThemes && (
                  <div
                    className="py-8 text-center text-xs"
                    style={{
                      color: "#5C5954",
                      fontFamily: "Inter, sans-serif",
                    }}
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
        className="px-5 pb-5 pt-3 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(212,175,110,0.08)" }}
      >
        <button
          id="panel-puzzle-start-btn"
          onClick={handleStart}
          disabled={starting}
          className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: starting
              ? "rgba(212,175,110,0.4)"
              : "linear-gradient(135deg, #D4AF6E 0%, #B8934A 100%)",
            color: "#080B14",
            boxShadow: "0 4px 20px rgba(212, 175, 110, 0.25)",
            fontFamily: "DM Mono, monospace",
          }}
          onMouseEnter={(e) => {
            if (!starting) {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 6px 28px rgba(212, 175, 110, 0.4)";
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 4px 20px rgba(212, 175, 110, 0.25)";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(0)";
          }}
        >
          {starting ? (
            <>
              <div
                className="w-3.5 h-3.5 rounded-full border-2 animate-spin border-current"
                style={{ borderTopColor: "transparent" }}
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
            className="text-center text-[10px] mt-1.5"
            style={{ color: "#5C5954", fontFamily: "Inter, sans-serif" }}
          >
            No theme selected — all themes will be included
          </p>
        )}
      </div>
    </div>
  );
}
