/**
 * ContentGridCard.tsx
 *
 * Content card component for /your-content library view.
 * Features live FEN mini-board thumbnail, move counts, retention heat marker,
 * and quick hover actions (Preview, Edit, Pin).
 * Fully theme-aware for light and dark modes.
 */

import { Play, Eye, ThumbsUp, Flame, Pin } from "lucide-react";
import { ThemedChessboard } from "../ThemedChessboard";
import { soundManager } from "../../utils/SoundManager";
import type { MasterclassItem } from "../../data/creatorMockData";

interface ContentGridCardProps {
  item: MasterclassItem;
  onPreviewClick: (item: MasterclassItem) => void;
  onPinClick?: (item: MasterclassItem) => void;
}

export function ContentGridCard({ item, onPreviewClick, onPinClick }: ContentGridCardProps) {
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
        {/* Category & Status */}
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
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

        {/* Live FEN Mini Board Thumbnail */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-brand-text/20 bg-obsidian group-hover:border-brand-accent/40 transition-colors">
          <ThemedChessboard
            options={{
              position: item.thumbnailFen,
              boardOrientation: "white",
              showNotation: false,
              allowDragging: false,
            }}
          />

          {/* Video Duration & PGN Count */}
          <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-md bg-black/80 border border-white/20 text-[10px] font-mono text-white font-semibold shadow-md">
            {item.videoDuration} • {item.moveCount} Moves
          </div>

          {/* Hover Action Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playButtonClick();
                onPreviewClick(item);
              }}
              className="p-3.5 rounded-full bg-brand-accent text-obsidian shadow-2xl hover:scale-110 active:scale-95 transition-transform"
              title="Preview Synchronized Lesson"
            >
              <Play className="w-5 h-5 fill-current" />
            </button>

            {onPinClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  soundManager.playButtonClick();
                  onPinClick(item);
                }}
                className="p-3 rounded-full bg-black/60 text-amber-400 border border-amber-400/40 shadow-2xl hover:scale-110 active:scale-95 transition-transform"
                title="Pin to Channel Featured"
              >
                <Pin className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-base font-display font-bold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2 leading-snug">
            {item.title}
          </h4>
          <p className="text-xs font-sans text-brand-secondary mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Replay Marker Tag */}
        {item.mostReplayedMove && item.mostReplayedMove !== "Draft Mode" && (
          <div className="flex items-center gap-2 py-1">
            <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
            <span className="px-2.5 py-0.5 rounded-full bg-rose-700 text-white text-[10px] font-mono font-bold truncate shadow-sm">
              {item.mostReplayedMove}
            </span>
          </div>
        )}
      </div>

      {/* Footer Performance Metrics */}
      <div className="pt-3 mt-3 border-t border-brand-text/10 flex items-center justify-between text-xs font-sans text-brand-secondary">
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
