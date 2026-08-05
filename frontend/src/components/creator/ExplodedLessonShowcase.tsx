/**
 * ExplodedLessonShowcase.tsx
 *
 * Flagship "Inside an XLChess Lesson" Exploded Product View.
 * Demonstrates 4 distinct student workflow modes:
 * Tab 1: Video Hook (HD Video Mockup & Chapters)
 * Tab 2: Interactive Board (Playable Board & Move Stepper)
 * Tab 3: Move Tree & Notes (Variation Tree & GM Annotations)
 * Tab 4: Position Discussion (Student Q&A & Creator Reply)
 */

import { useState } from "react";
import { Play, Pause, BookOpen, MessageSquare, Sparkles, ChevronRight, ChevronLeft, RotateCcw, CheckCircle2 } from "lucide-react";
import { ThemedChessboard } from "../ThemedChessboard";
import { BoardCoordinates } from "../BoardCoordinates";
import { soundManager } from "../../utils/SoundManager";

export function ExplodedLessonShowcase() {
  const [activeTab, setActiveTab] = useState<"video" | "board" | "pgn" | "discussion">("board");
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number>(3); // 7.Ne5 move
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replied, setReplied] = useState(false);

  const movesList = [
    { move: "1. d4 Nf6", label: "Catalan Setup", time: "01:20", fen: "rnbqk2r/ppp1bppp/4pn2/3p4/2PP4/6P1/PP2PPBP/RNBQK1NR w KQkq - 1 4" },
    { move: "2. c4 e6", label: "Flexible Indian Defense", time: "03:45", fen: "rnbq1rk1/ppp1bppp/4pn2/3p4/2PP4/5NP1/PP2PPBP/RNBQ1RK1 b - - 5 5" },
    { move: "3. g3 d5", label: "Main Line Fianchetto", time: "06:10", fen: "rnbq1rk1/ppp1bppp/4pn2/8/2pP4/5NP1/PP2PPBP/RNBQ1RK1 w - - 0 6" },
    { move: "4. 7.Ne5!", label: "The 7.Ne5 Sacrifice!!", time: "09:30", highlight: true, fen: "rnbq1rk1/ppp1bppp/4pn2/3pN3/2pP4/6P1/PP2PPBP/RNBQ1RK1 b - - 1 7" },
  ];

  const handleSelectMove = (index: number) => {
    soundManager.playButtonClick();
    setSelectedMoveIndex(index);
  };

  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    soundManager.playButtonClick();
    setReplied(true);
    setReplyText("");
    setTimeout(() => setReplied(false), 3000);
  };

  const currentMove = movesList[selectedMoveIndex] || movesList[3];

  return (
    <div className="w-full rounded-3xl border border-brand-accent/30 bg-brand-surface p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-brand-text/10">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-brand-accent uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-brand-accent" />
            <span>Interactive Lesson Flow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-brand-text">
            Inside an XLChess Lesson
          </h2>
        </div>
        
        <span className="px-3 py-1 rounded-full text-xs font-sans font-medium bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
          Student Learning Journey
        </span>
      </div>

      {/* 4-Step Workflow Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: "video", label: "1. Video Hook", icon: Play },
          { id: "board", label: "2. Interactive Board", icon: BookOpen },
          { id: "pgn", label: "3. Move Tree & Notes", icon: Sparkles },
          { id: "discussion", label: "4. Position Discussion", icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playButtonClick();
                setActiveTab(tab.id as "video" | "board" | "pgn" | "discussion");
              }}
              className={`p-3 rounded-2xl border text-xs font-sans font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-brand-accent/20 border-brand-accent text-brand-accent shadow-md scale-[1.02]"
                  : "bg-brand-text/5 border-brand-text/10 text-brand-secondary hover:text-brand-text hover:bg-brand-text/10"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* DYNAMIC VIEW TAB CONTENT */}
      {/* ── TAB 1: VIDEO HOOK ──────────────────────────────────────────────── */}
      {activeTab === "video" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 animate-fadeIn">
          <div className="lg:col-span-7">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-brand-accent/40 bg-slate-950 p-4 shadow-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono text-white z-10">
                <span className="px-2.5 py-0.5 rounded bg-black/80 border border-white/20 font-bold">
                  4K 60FPS HD Stream
                </span>
                <span className="text-amber-400 font-bold">28:15</span>
              </div>

              <button
                onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                className="self-center p-5 rounded-full bg-brand-accent text-obsidian shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
              >
                {isVideoPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
              </button>

              <div className="space-y-2 z-10">
                <div className="flex items-center justify-between text-xs font-mono text-stone-200">
                  <span>Chapter: The 7.Ne5 Sacrifice</span>
                  <span>18:25 / 28:15</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden relative">
                  <div className="h-full bg-brand-accent w-[65%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xl font-display font-bold text-brand-text">
              1. Synchronized HD Video Hook
            </h3>
            <p className="text-xs sm:text-sm font-sans text-brand-secondary leading-relaxed">
              Video lessons on XLChess aren't static mp4 embeds. As Alex Vance speaks, the video timeline automatically triggers interactive PGN moves on the student's board.
            </p>
            <div className="p-3.5 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 text-xs font-sans text-brand-text space-y-1">
              <strong className="text-brand-accent">Creator Advantage:</strong>
              <p>Students can pause at any second and test their own moves directly on the board without losing their video spot.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: INTERACTIVE BOARD ───────────────────────────────────────── */}
      {activeTab === "board" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 animate-fadeIn">
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="relative w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden border-2 border-brand-accent/40 shadow-[0_16px_40px_rgba(0,0,0,0.6)] bg-obsidian">
              <ThemedChessboard
                options={{
                  position: currentMove.fen,
                  boardOrientation: "white",
                  showNotation: false, // Handled cleanly by BoardCoordinates to avoid duplication!
                  allowDragging: false,
                }}
              />
              <BoardCoordinates boardOrientation="white" />

              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-rose-950/90 border border-rose-500/50 text-[11px] font-mono text-rose-200 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Most Replayed: Move 7.Ne5!</span>
              </div>
            </div>

            {/* Inline Board Move Controls */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => handleSelectMove(Math.max(0, selectedMoveIndex - 1))}
                className="px-3 py-1.5 rounded-xl bg-brand-text/10 hover:bg-brand-text/20 text-brand-text font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => handleSelectMove(0)}
                className="px-3 py-1.5 rounded-xl bg-brand-text/10 hover:bg-brand-text/20 text-brand-text font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                onClick={() => handleSelectMove(Math.min(movesList.length - 1, selectedMoveIndex + 1))}
                className="px-3 py-1.5 rounded-xl bg-brand-accent text-obsidian font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col space-y-4">
            <div className="p-4 rounded-2xl bg-brand-text/5 border border-brand-accent/30 shadow-inner space-y-1">
              <span className="text-xs font-mono text-brand-accent font-semibold uppercase">
                Current Position Highlight ({currentMove.move})
              </span>
              <p className="text-sm font-sans text-brand-text leading-relaxed">
                "7.Ne5 puts immediate tension on c4 while opening the g2-bishop's sightline directly down the h1-a8 diagonal. Black must react precisely or lose central control."
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono text-brand-secondary uppercase font-semibold">
                Click any variation to step the board:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {movesList.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectMove(idx)}
                    className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
                      selectedMoveIndex === idx
                        ? "bg-brand-accent/20 border-brand-accent text-brand-accent font-bold shadow-md"
                        : "bg-brand-text/5 border-brand-text/10 text-brand-secondary hover:text-brand-text"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-brand-secondary font-mono">{m.time}</span>
                      <span>{m.move}</span>
                    </div>
                    {m.highlight && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                        Lethal
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: MOVE TREE & NOTES ───────────────────────────────────────── */}
      {activeTab === "pgn" && (
        <div className="space-y-4 pt-2 animate-fadeIn">
          <h3 className="text-xl font-display font-bold text-brand-text">
            3. Interactive PGN Move Tree & Grandmaster Annotations
          </h3>
          <p className="text-xs sm:text-sm font-sans text-brand-secondary leading-relaxed">
            Every variation has move-by-move annotations written directly by Alex Vance. Students never wonder *why* a move works.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-brand-text/5 border border-brand-text/10 space-y-2">
              <span className="text-xs font-mono text-brand-accent font-bold">Mainline 7.Ne5!</span>
              <p className="text-xs font-sans text-brand-text">
                Immediately pressures c4 pawn. Forces Black's knight to c6, locking Black's position into defensive posture.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-brand-text/5 border border-brand-text/10 space-y-2">
              <span className="text-xs font-mono text-brand-accent font-bold">Alternative 7.Qa4+</span>
              <p className="text-xs font-sans text-brand-text">
                Black plays 7...Bd7 8.Qxc4 Bc6! equalizing easily. That's why 7.Ne5 is superior!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-brand-text/5 border border-brand-text/10 space-y-2">
              <span className="text-xs font-mono text-brand-accent font-bold">Winning Pawn Break 14.d5!!</span>
              <p className="text-xs font-sans text-brand-text">
                The ultimate tactical pawn storm. Replayed 1,420 times by Alex Vance's students.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: POSITION DISCUSSION ─────────────────────────────────────── */}
      {activeTab === "discussion" && (
        <div className="space-y-4 pt-2 animate-fadeIn">
          <h3 className="text-xl font-display font-bold text-brand-text">
            4. Position-Specific Discussions & Student Q&A
          </h3>
          <p className="text-xs sm:text-sm font-sans text-brand-secondary leading-relaxed">
            Students ask questions pinned directly to the exact move position (Move 7.Ne5). No more vague YouTube comments like "at 4:20"!
          </p>

          <div className="p-4 rounded-2xl bg-brand-text/5 border border-brand-text/10 space-y-3">
            <div className="p-3 rounded-xl bg-brand-surface border border-brand-text/10 text-xs font-sans space-y-1">
              <div className="flex items-center justify-between text-brand-secondary font-mono text-[11px]">
                <span className="text-brand-text font-bold">IM Marcus Vance (Student)</span>
                <span>2 hours ago</span>
              </div>
              <p className="text-brand-text leading-relaxed">
                "Why is 7.Ne5 superior to 7.Qa4+ here? The interactive board makes it clear!"
              </p>
              <div className="mt-2 p-2.5 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-text text-xs">
                <strong className="text-brand-accent">Alex Vance (Creator Reply):</strong> Spot on Marcus! 7.Ne5 opens the g2-bishop sightline immediately without wasting queen tempo.
              </div>
            </div>

            <form onSubmit={handlePostReply} className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Ask Alex Vance a question on Move 7.Ne5…"
                className="flex-1 px-4 py-2.5 text-xs font-sans rounded-xl bg-brand-surface border border-brand-text/20 text-brand-text placeholder:text-brand-secondary outline-none focus:border-brand-accent transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-brand-accent text-obsidian font-sans text-xs font-bold hover:bg-brand-accent/90 transition-colors cursor-pointer"
              >
                Post
              </button>
            </form>

            {replied && (
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Question posted to Alex Vance's discussion queue!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
