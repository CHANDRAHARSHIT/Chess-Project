/**
 * OpeningsPage.tsx
 *
 * The /openings route. Full backend-driven opening trainer.
 *
 * Layout (desktop):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  [Openings Sidebar]  │  Top bar (title + ECO + reset)   │
 *   │  ─ Search bar        ├───────────────────────────────────┤
 *   │  ─ Scrollable list   │  Progress bar                     │
 *   │    of openings       ├───────────────────────────────────┤
 *   │                      │  Board          │  Coach Panel    │
 *   └──────────────────────┴─────────────────┴─────────────────┘
 *
 * Data flow:
 *   OpeningService.getAllOpenings() → state → user selects one →
 *   useOpeningTrainer(selectedOpening) → OpeningBoard + CoachPanel
 */

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, RotateCcw, Search, BookMarked, ChevronRight } from "lucide-react";
import { useOpeningTrainer } from "../hooks/useOpeningTrainer";
import { OpeningService } from "../services/opening";
import { OpeningBoard } from "../components/openings/OpeningBoard";
import { OpeningCoachPanel } from "../components/openings/OpeningCoachPanel";
import { OpeningProgressBar } from "../components/openings/OpeningProgressBar";
import { OpeningCompletionCard } from "../components/openings/OpeningCompletionCard";
import { soundManager } from "../utils/SoundManager";
import type { Opening } from "../types/opening";

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface OpeningSidebarProps {
  openings: Opening[];
  selectedId: string | null;
  onSelect: (opening: Opening) => void;
  isLoading: boolean;
  error: string | null;
}

function OpeningSidebar({
  openings,
  selectedId,
  onSelect,
  isLoading,
  error,
}: OpeningSidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return openings;
    const q = query.toLowerCase();
    return openings.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.eco.toLowerCase().includes(q)
    );
  }, [openings, query]);

  return (
    <aside
      className="flex flex-col shrink-0 rounded-2xl overflow-hidden"
      style={{
        width: "280px",
        height: "calc(100vh - 11rem)",
        background: "rgba(8,11,20,0.80)",
        border: "1px solid rgba(212,175,110,0.10)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Sidebar header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(212,175,110,0.08)" }}
      >
        <BookMarked className="w-4 h-4 text-brand-accent shrink-0" />
        <span className="font-display text-sm font-semibold text-brand-text">
          Openings
        </span>
        <span
          className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(212,175,110,0.08)",
            color: "rgba(212,175,110,0.7)",
            border: "1px solid rgba(212,175,110,0.15)",
          }}
        >
          {filtered.length}
        </span>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-secondary pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or ECO…"
            className="w-full pl-8 pr-3 py-2 text-xs font-sans rounded-lg outline-none transition-all duration-200 placeholder:text-brand-secondary/40"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e5dfd5",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(212,175,110,0.35)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {isLoading && (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-11 rounded-lg animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 text-center">
            <p className="font-sans text-xs text-rose-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="p-4 text-center">
            <p className="font-sans text-xs text-brand-secondary">No openings match your search.</p>
          </div>
        )}

        {!isLoading &&
          !error &&
          filtered.map((opening) => {
            const isSelected = opening.id === selectedId;
            return (
              <button
                key={opening.id}
                onClick={() => {
                  soundManager.playButtonClick();
                  onSelect(opening);
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2.5 transition-all duration-150 cursor-pointer group"
                style={{
                  background: isSelected
                    ? "rgba(212,175,110,0.08)"
                    : "transparent",
                  borderLeft: isSelected
                    ? "2px solid rgba(212,175,110,0.6)"
                    : "2px solid transparent",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-mono text-[9px] uppercase tracking-widest shrink-0"
                      style={{ color: "rgba(212,175,110,0.65)" }}
                    >
                      {opening.eco}
                    </span>
                  </div>
                  <p
                    className="font-sans text-xs leading-tight truncate mt-0.5 transition-colors duration-150"
                    style={{
                      color: isSelected ? "#e5dfd5" : "#9ca3af",
                    }}
                  >
                    {opening.name}
                  </p>
                </div>
                <ChevronRight
                  className="w-3 h-3 shrink-0 transition-all duration-150 opacity-0 group-hover:opacity-100"
                  style={{ color: "rgba(212,175,110,0.5)" }}
                />
              </button>
            );
          })}
      </div>
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OpeningsPage() {
  const navigate = useNavigate();

  const [openings, setOpenings] = useState<Opening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);

  // Fetch all openings from backend on mount
  useEffect(() => {
    setIsLoading(true);
    setFetchError(null);
    OpeningService.getAllOpenings()
      .then((data) => {
        setOpenings(data);
        // Auto-select the first opening so the board is immediately ready
        if (data.length > 0) setSelectedOpening(data[0]);
      })
      .catch(() => {
        setFetchError("Failed to load openings. Please try again.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const trainer = useOpeningTrainer(selectedOpening);

  const {
    fen,
    boardOrientation,
    status,
    currentStepIndex,
    totalSteps,
    progress,
    coachMessage,
    squareStyles,
    onPieceDrop,
    reset,
    movesPlayed,
  } = trainer;

  const isComplete = status === "complete";
  const allowDragging = status === "playing";

  const ringStyle: "none" | "wrong" | "complete" =
    status === "wrong" ? "wrong" : isComplete ? "complete" : "none";

  // User move step count (exclude opponent moves — every other move starting at index 0)
  const userStepsDone = Math.ceil(
    Math.min(currentStepIndex, totalSteps) / 2
  );
  const totalUserSteps = Math.ceil(totalSteps / 2);

  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 py-6 gap-6 max-w-[1400px] mx-auto w-full">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => {
            soundManager.playButtonClick();
            navigate(-1);
          }}
          className="flex items-center gap-1.5 text-brand-secondary hover:text-white text-sm font-sans transition-colors duration-200 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>

        {/* Opening title + ECO */}
        <div className="flex flex-col items-center gap-0.5 flex-1 text-center">
          {selectedOpening?.eco && (
            <span className="font-mono text-[10px] text-brand-accent uppercase tracking-widest">
              ECO {selectedOpening.eco}
            </span>
          )}
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-brand-text leading-tight">
            {selectedOpening?.name ?? "Opening Trainer"}
          </h1>
          {isLoading && (
            <span className="font-mono text-[10px] text-brand-secondary animate-pulse">
              Loading openings…
            </span>
          )}
        </div>

        <button
          onClick={() => {
            soundManager.playButtonClick();
            reset();
          }}
          disabled={!selectedOpening}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-brand-secondary hover:text-white text-xs font-mono uppercase tracking-wider hover:bg-white/5 border border-transparent hover:border-brand-border/40 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      {selectedOpening && (
        <OpeningProgressBar
          currentUserStep={isComplete ? totalUserSteps : userStepsDone}
          totalUserSteps={totalUserSteps}
          progress={progress}
        />
      )}

      {/* ── Main content: sidebar + board + coach ─────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* ── Opening list sidebar ─────────────────────────────────────── */}
        <div className="hidden lg:block shrink-0 self-start sticky top-6">
          <OpeningSidebar
            openings={openings}
            selectedId={selectedOpening?.id ?? null}
            onSelect={setSelectedOpening}
            isLoading={isLoading}
            error={fetchError}
          />
        </div>

        {/* Mobile: compact selector */}
        <div className="lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-secondary pointer-events-none" />
            <select
              className="w-full pl-9 pr-4 py-2.5 text-sm font-sans rounded-xl outline-none cursor-pointer appearance-none"
              style={{
                background: "rgba(8,11,20,0.80)",
                border: "1px solid rgba(212,175,110,0.15)",
                color: "#e5dfd5",
              }}
              value={selectedOpening?.id ?? ""}
              onChange={(e) => {
                const o = openings.find((o) => o.id === e.target.value);
                if (o) {
                  soundManager.playButtonClick();
                  setSelectedOpening(o);
                }
              }}
              disabled={isLoading}
            >
              {isLoading && <option>Loading…</option>}
              {openings.map((o) => (
                <option key={o.id} value={o.id}>
                  [{o.eco}] {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Board + Coach ─────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-w-0">
          {/* Board column */}
          <div className="flex-1 flex flex-col items-center gap-4">
            {!selectedOpening && !isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 mt-16 text-center">
                <BookMarked className="w-10 h-10 text-brand-accent/30" />
                <p className="font-sans text-sm text-brand-secondary">
                  Select an opening from the list to start training.
                </p>
              </div>
            ) : isComplete ? (
              <OpeningCompletionCard
                opening={selectedOpening!}
                movesPlayed={movesPlayed}
                onPlayAgain={() => {
                  soundManager.playButtonClick();
                  reset();
                }}
              />
            ) : (
              <>
                <OpeningBoard
                  fen={fen}
                  boardOrientation={boardOrientation}
                  squareStyles={squareStyles}
                  onPieceDrop={onPieceDrop}
                  allowDragging={allowDragging}
                  ringStyle={ringStyle}
                />

                {/* Below-board status pill */}
                <div className="h-8 flex items-center justify-center">
                  {status === "wrong" ? (
                    <span className="font-mono uppercase tracking-wider text-xs font-bold text-rose-400 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full animate-bounce">
                      Incorrect move — try again
                    </span>
                  ) : status === "opponent" ? (
                    <span className="font-mono uppercase tracking-wider text-xs font-bold text-brand-secondary flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
                      Opponent thinking…
                    </span>
                  ) : status === "idle" ? (
                    <span className="font-mono uppercase tracking-wider text-xs font-bold text-brand-secondary/50 flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                      Choose an opening to begin
                    </span>
                  ) : (
                    <span className="font-mono uppercase tracking-wider text-xs font-bold text-brand-accent flex items-center gap-1.5 bg-brand-accent/5 border border-brand-accent/15 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                      Make the highlighted move
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Coach panel column */}
          {!isComplete && selectedOpening && (
            <div
              className="lg:w-72 xl:w-80 rounded-2xl p-5 flex flex-col shrink-0"
              style={{
                background: "rgba(8,11,20,0.7)",
                border: "1px solid rgba(212,175,110,0.12)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <OpeningCoachPanel
                coachMessage={coachMessage}
                status={status}
                movesPlayed={movesPlayed}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Opening description footer ───────────────────────────────────── */}
      {!isComplete && selectedOpening && (
        <p className="font-sans text-xs text-brand-secondary/50 text-center max-w-lg mx-auto leading-relaxed">
          {selectedOpening.name} — ECO {selectedOpening.eco}
        </p>
      )}
    </div>
  );
}
