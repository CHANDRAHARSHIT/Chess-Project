/**
 * MasterclassCard.tsx
 *
 * Card component for Alex Vance's featured masterclasses.
 * Combines video duration, student completion rate, PGN move counts,
 * and the "Most Replayed Position" heat marker.
 * Fully theme-aware for light and dark modes.
 */

import { Play, Flame, Eye, ThumbsUp } from "lucide-react";
import { ThemedChessboard } from "../ThemedChessboard";
import { soundManager } from "../../utils/SoundManager";
import type { MasterclassItem } from "../../data/creatorMockData";

interface MasterclassCardProps {
  item: MasterclassItem;
  onPreviewClick: (item: MasterclassItem) => void;
}

export function MasterclassCard({ item, onPreviewClick }: MasterclassCardProps) {
  const handleClick = () => {
    soundManager.playButtonClick();
    onPreviewClick(item);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative w-full rounded-3xl border border-brand-text/15 bg-brand-surface p-5 shadow-xl transition-all duration-300 hover:border-brand-accent/50 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(212,175,110,0.15)] cursor-pointer flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Top Header: Category & Status */}
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full text-[11px] font-sans font-semibold bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
            {item.category}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-medium ${
              item.status === "Published"
                ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-600/40"
                : "bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-600/40"
            }`}
          >
            {item.status}
          </span>
        </div>

        {/* Live Mini Chessboard FEN Thumbnail */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-brand-text/20 bg-obsidian flex items-center justify-center group-hover:border-brand-accent/40 transition-colors">
          <div className="w-[180px] aspect-square">
            <ThemedChessboard
              options={{
                position: item.thumbnailFen,
                boardOrientation: "white",
                showNotation: false,
                allowDragging: false,
              }}
            />
          </div>

          {/* Video Duration Chip */}
          <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-md bg-black/80 border border-white/20 text-[10px] font-mono text-white font-semibold shadow-md">
            {item.videoDuration}
          </div>

          {/* Hover Play Button Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="p-3.5 rounded-full bg-brand-accent text-obsidian shadow-2xl scale-90 group-hover:scale-100 transition-transform">
              <Play className="w-6 h-6 fill-current" />
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-lg font-display font-bold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2 leading-snug">
            {item.title}
          </h4>
          <p className="text-xs font-sans text-brand-secondary mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Replay Heat Marker Tag */}
        {item.mostReplayedMove && item.mostReplayedMove !== "Draft Mode" && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-600/30 flex items-center gap-2 text-xs font-mono text-rose-900 dark:text-rose-200 shadow-sm">
            <Flame className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0 animate-pulse" />
            <span className="truncate">Most Replayed: <strong className="font-bold">{item.mostReplayedMove}</strong></span>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="pt-4 mt-4 border-t border-brand-text/10 flex items-center justify-between text-xs font-sans text-brand-secondary">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <strong className="text-brand-text font-mono">{item.views.toLocaleString()}</strong>
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            <strong className="text-brand-text font-mono">{item.likes.toLocaleString()}</strong>
          </span>
        </div>

        <span className="text-brand-accent font-mono font-bold">
          {item.studentCompletion}% Completion
        </span>
      </div>
    </div>
  );
}
