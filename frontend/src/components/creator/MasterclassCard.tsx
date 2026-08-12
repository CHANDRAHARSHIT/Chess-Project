/**
 * MasterclassCard.tsx
 *
 * Card component for featured masterclasses.
 * Displays class details with a frosted blur "Coming Soon" UI overlay on hover.
 */

import { Flame, Eye, ThumbsUp } from "lucide-react";
import { ThemedChessboard } from "@/components/ThemedChessboard";
import type { MasterclassItem } from "@/data/creatorMockData";

interface MasterclassCardProps {
  item: MasterclassItem;
}

export function MasterclassCard({ item }: MasterclassCardProps) {
  return (
    <div className="group relative w-full rounded-3xl border border-brand-text/15 bg-brand-surface p-5 transition-all duration-300 hover:border-brand-accent/50 cursor-pointer overflow-hidden flex flex-col justify-between">
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
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-brand-text/20 bg-obsidian group-hover:border-brand-accent/40 transition-colors pointer-events-none">
          <ThemedChessboard
            options={{
              position: item.thumbnailFen,
              boardOrientation: "white",
              showNotation: false,
              allowDragging: false,
            }}
          />

          {/* Video Duration Chip */}
          <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-md bg-black/80 border border-white/20 text-[10px] font-mono text-white font-semibold">
            {item.videoDuration}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-lg font-display font-bold text-brand-text transition-colors line-clamp-2 leading-snug">
            {item.title}
          </h4>
          <p className="text-xs font-sans text-brand-secondary mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Replay Heat Marker Tag */}
        {item.mostReplayedMove && item.mostReplayedMove !== "Draft Mode" && (
          <div className="flex items-center gap-2 py-1">
            <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
            <span className="px-2.5 py-0.5 rounded-full bg-rose-700 text-white text-[10px] font-mono font-bold truncate">
              {item.mostReplayedMove}
            </span>
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

      {/* Hover UI Overlay: Coming Soon with Blur Backdrop */}
      <div className="absolute inset-0 bg-obsidian/85 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-6 z-20 pointer-events-none text-center">
        <span className="px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-brand-accent text-obsidian uppercase tracking-wider">
          Coming Soon
        </span>
        <p className="text-xs font-sans text-brand-secondary font-medium max-w-[210px] leading-relaxed">
          Masterclass interactive video player currently in development
        </p>
      </div>
    </div>
  );
}



