/**
 * SynchronizedStudyModal.tsx
 *
 * Hero Showcase Modal for Jimmy's Live Demo.
 * Demonstrates Interactive Lesson Preview (Video + Interactive Board + PGN Move Tree + Position Discussions).
 * Optimized layout: max-w-5xl container with zero awkward empty whitespace.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, ChevronRight, MessageSquare, Sparkles, CheckCircle2 } from "lucide-react";
import { ThemedChessboard } from "../ThemedChessboard";
import { BoardCoordinates } from "../BoardCoordinates";
import { soundManager } from "../../utils/SoundManager";
import type { MasterclassItem } from "../../data/creatorMockData";

interface SynchronizedStudyModalProps {
  item: MasterclassItem | null;
  onClose: () => void;
}

export function SynchronizedStudyModal({ item, onClose }: SynchronizedStudyModalProps) {
  if (!item) return null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMoveIndex, setActiveMoveIndex] = useState(0);
  const [replyInput, setReplyInput] = useState("");
  const [localDiscussions, setLocalDiscussions] = useState(item.positionDiscussion);
  const [discussionSent, setDiscussionSent] = useState(false);

  const moves = item.pgn && item.pgn.length > 0
    ? item.pgn
    : ["1. d4 Nf6", "2. c4 e6", "3. g3 d5", "4. Bg2 Be7", "5. Nf3 O-O", "6. O-O dxc4", "7. Ne5!"];

  const handleSelectMove = (index: number) => {
    soundManager.playButtonClick();
    setActiveMoveIndex(index);
  };

  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;

    soundManager.playButtonClick();
    setLocalDiscussions((prev) => [
      ...prev,
      {
        moveIndex: activeMoveIndex,
        studentName: "Alex Vance (Creator)",
        studentAvatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='%23d4af6e'/><path d='M32 12c-4.4 0-8 3.6-8 8 0 3.3 2 6.2 5 7.4V32h-4v4h14v-4h-4v-4.6c3-1.2 5-4.1 5-7.4 0-4.4-3.6-8-8-8z' fill='%23080b14'/></svg>",
        comment: replyInput,
        timeAgo: "Just now",
      },
    ]);
    setReplyInput("");
    setDiscussionSent(true);
    setTimeout(() => setDiscussionSent(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-obsidian/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="relative w-full max-w-5xl rounded-3xl border border-brand-accent/30 bg-obsidian-mid p-5 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.85)] space-y-5 max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-full bg-brand-text/10 hover:bg-brand-text/20 text-brand-text transition-colors cursor-pointer active:scale-95"
            aria-label="Close Preview Modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Title & Badge */}
          <div className="flex flex-col space-y-1 pr-10">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-brand-accent uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-brand-accent" />
              <span>Interactive Lesson Preview</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text tracking-wide">
              {item.title}
            </h2>
          </div>

          {/* Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Video Player Mockup & Timeline (6 Cols) */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-brand-accent/30 bg-obsidian flex flex-col justify-between p-4 shadow-xl">
                {/* Top Video Status */}
                <div className="flex items-center justify-between text-xs font-mono text-brand-text z-10">
                  <span className="px-2.5 py-0.5 rounded bg-obsidian/90 border border-brand-text/30 font-medium">
                    HD Masterclass Video
                  </span>
                  <span className="text-brand-accent font-bold">
                    {item.videoDuration}
                  </span>
                </div>

                {/* Center Play Button Overlay */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="self-center p-4 rounded-full bg-brand-accent text-obsidian shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                  title="Toggle Video Playback"
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                </button>

                {/* Timeline Markers Linked to PGN Moves */}
                <div className="space-y-2 z-10">
                  <div className="flex items-center justify-between text-xs font-mono text-stone-300">
                    <span>Timeline Progress</span>
                    <span>Move {activeMoveIndex + 1} of {moves.length}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-brand-text/15 overflow-hidden relative">
                    <div
                      className="h-full bg-brand-accent transition-all duration-300"
                      style={{ width: `${((activeMoveIndex + 1) / moves.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Timeline Chapter Markers List */}
              {item.timelineMarkers && item.timelineMarkers.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-obsidian-glass border border-brand-text/15 space-y-2">
                  <span className="text-xs font-mono text-brand-accent font-semibold uppercase tracking-wide">
                    Lesson Chapters:
                  </span>
                  <div className="space-y-1.5">
                    {item.timelineMarkers.map((marker, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectMove(marker.moveIndex)}
                        className="p-2 rounded-xl bg-brand-text/5 hover:bg-brand-accent/15 border border-brand-text/10 text-xs font-sans flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="font-mono text-brand-accent font-bold">{marker.time}</span>
                        <span className="text-brand-text font-medium">{marker.title}</span>
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Interactive Chessboard & PGN Tree (6 Cols) */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              {/* Interactive Chessboard Container */}
              <div className="relative w-full max-w-[340px] aspect-square mx-auto rounded-2xl overflow-hidden border-2 border-brand-accent/40 shadow-[0_16px_40px_rgba(0,0,0,0.7)] bg-obsidian">
                <ThemedChessboard
                  options={{
                    position: item.thumbnailFen,
                    boardOrientation: "white",
                    showNotation: true,
                    allowDragging: false,
                  }}
                />
                <BoardCoordinates boardOrientation="white" />
              </div>

              {/* Interactive PGN Moves Grid */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-stone-300 uppercase font-semibold">
                  Interactive Move Tree (Click to jump):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {moves.map((mv, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectMove(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        activeMoveIndex === idx
                          ? "bg-brand-accent text-obsidian font-bold shadow-md scale-105"
                          : "bg-brand-text/10 text-brand-text hover:bg-brand-text/20"
                      }`}
                    >
                      {mv}
                    </button>
                  ))}
                </div>
              </div>

              {/* Move Commentary Annotation */}
              {item.annotations && item.annotations[activeMoveIndex] && (
                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-brand-accent/40 text-xs font-sans text-brand-text leading-relaxed italic">
                  "{item.annotations[activeMoveIndex]}"
                </div>
              )}

              {/* Position Discussion Queue */}
              <div className="p-4 rounded-2xl bg-obsidian-glass border border-brand-text/15 space-y-3">
                <span className="text-xs font-mono text-brand-accent font-semibold uppercase tracking-wide flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>Position Discussions (Move {activeMoveIndex + 1})</span>
                </span>

                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {localDiscussions.map((disc, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-brand-text/5 text-xs font-sans space-y-1 border border-brand-text/10">
                      <div className="flex items-center justify-between text-stone-400 font-mono text-[11px]">
                        <span className="text-brand-text font-bold">{disc.studentName}</span>
                        <span>{disc.timeAgo}</span>
                      </div>
                      <p className="text-brand-text/90 leading-relaxed">{disc.comment}</p>
                      {disc.creatorReply && (
                        <p className="text-brand-accent bg-brand-accent/10 p-2 rounded-lg text-xs mt-1 border border-brand-accent/20">
                          <strong>Alex Vance:</strong> {disc.creatorReply}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={handlePostReply} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder="Reply as Alex Vance (Creator)…"
                    className="flex-1 px-3.5 py-2 text-xs font-sans rounded-xl bg-obsidian border border-brand-text/20 text-brand-text placeholder:text-stone-500 outline-none focus:border-brand-accent/60 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-brand-accent text-obsidian font-sans text-xs font-bold hover:bg-brand-accent/90 transition-colors cursor-pointer active:scale-95"
                  >
                    Reply
                  </button>
                </form>

                {discussionSent && (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Response posted to student thread!
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
