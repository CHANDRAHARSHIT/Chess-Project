/**
 * ExplodedLessonShowcase.tsx
 *
 * Flagship "Inside an XLChess Lesson" Exploded Product View.
 * Demonstrates the full interactive XLChess student experience:
 * Video Hook → Interactive Board → Move Tree → Annotations → Position Discussion → Student Bookmarks.
 */

import { useState } from "react";
import { Play, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import { ThemedChessboard } from "../ThemedChessboard";
import { BoardCoordinates } from "../BoardCoordinates";
import { soundManager } from "../../utils/SoundManager";

export function ExplodedLessonShowcase() {
  const [activeTab, setActiveTab] = useState<"video" | "board" | "pgn" | "discussion">("board");
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number>(3); // 7.Ne5 move

  const movesList = [
    { move: "1. d4 Nf6", label: "Catalan Setup", time: "01:20" },
    { move: "2. c4 e6", label: "Flexible Indian Defense", time: "03:45" },
    { move: "3. g3 d5", label: "Main Line Fianchetto", time: "06:10" },
    { move: "4. Bg2 Be7", label: "Solid Development", time: "09:30" },
    { move: "5. Nf3 O-O", label: "Kingside Castling", time: "12:15" },
    { move: "6. O-O dxc4", label: "Open Catalan Acceptance", time: "15:40" },
    { move: "7. Ne5!", label: "The 7.Ne5 Sacrifice!!", time: "18:25", highlight: true },
  ];

  const currentFen = "rnbq1rk1/ppp1bppp/4pn2/3pN3/2pP4/6P1/PP2PPBP/RNBQ1RK1 b - - 1 7";

  const handleSelectMove = (index: number) => {
    soundManager.playButtonClick();
    setSelectedMoveIndex(index);
  };

  return (
    <div className="w-full rounded-3xl border border-brand-accent/30 bg-obsidian-mid p-6 sm:p-8 shadow-2xl space-y-6">
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
                setActiveTab(tab.id as any);
              }}
              className={`p-3 rounded-2xl border text-xs font-sans font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-brand-accent/15 border-brand-accent text-brand-accent shadow-lg"
                  : "bg-obsidian-glass border-brand-text/10 text-stone-300 hover:text-brand-text hover:bg-brand-text/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Exploded Interactive Preview Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
        {/* Left: Synchronized Interactive Board Preview (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden border-2 border-brand-accent/40 shadow-[0_16px_40px_rgba(0,0,0,0.7)] bg-obsidian">
            <ThemedChessboard
              options={{
                position: currentFen,
                boardOrientation: "white",
                showNotation: true,
                allowDragging: false,
              }}
            />
            <BoardCoordinates boardOrientation="white" />

            {/* Replay Heat Marker Overlay */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-rose-950/90 border border-rose-500/50 text-[11px] font-mono text-rose-200 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Most Replayed: Move 7.Ne5! (1,420 times)</span>
            </div>
          </div>
        </div>

        {/* Right: Step-by-Step Lesson Details (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="p-4 rounded-2xl bg-obsidian-glass border border-brand-accent/30 shadow-inner">
            <span className="text-xs font-mono text-brand-accent font-semibold uppercase">
              Current Move Highlight ({movesList[selectedMoveIndex]?.move})
            </span>
            <p className="text-sm font-sans text-brand-text mt-1 leading-relaxed">
              "7.Ne5 puts immediate tension on c4 while opening the g2-bishop's sightline directly down the h1-a8 diagonal. Black must react precisely or lose central control."
            </p>
          </div>

          {/* Interactive Move List Selector */}
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-stone-300 uppercase font-semibold">
              Lesson Move Tree (Click to jump board & video):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {movesList.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectMove(idx)}
                  className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
                    selectedMoveIndex === idx
                      ? "bg-brand-accent/20 border-brand-accent text-brand-accent font-bold shadow-md"
                      : "bg-brand-text/5 border-brand-text/10 text-stone-300 hover:text-brand-text"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-mono">{m.time}</span>
                    <span>{m.move}</span>
                  </div>
                  {m.highlight && <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">Lethal</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Student Discussion Highlight */}
          <div className="p-3.5 rounded-2xl bg-brand-text/5 border border-brand-text/10 flex items-start gap-3">
            <MessageSquare className="w-4 h-4 text-brand-accent shrink-0 mt-1" />
            <div className="flex flex-col space-y-0.5">
              <span className="text-xs font-mono font-semibold text-brand-text">
                IM Marcus Vance (Student)
              </span>
              <p className="text-xs font-sans text-stone-300 italic">
                "Why is 7.Ne5 superior to 7.Qa4+ here? The interactive board makes it clear!"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
