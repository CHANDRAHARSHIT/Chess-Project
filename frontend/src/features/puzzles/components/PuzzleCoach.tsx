import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import type { PathNode } from '@/features/puzzles/pathway.types';

export type CoachStatus = 'idle' | 'correct' | 'wrong';

interface PuzzleCoachProps {
  selectedNode: PathNode | null;
  status: CoachStatus;
  onBackToMap?: () => void;
  /** Compact strip mode — used on mobile (default: false = full panel) */
  compact?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveIdleHint(node: PathNode | null): string {
  if (!node) return 'Select a puzzle from the map to begin.';
  if (node.description) return node.description;
  const sol = node.solution?.trim() || '';
  if (sol.endsWith('#')) return 'Deliver the checkmate — one move wins it all.';
  if (sol.includes('x')) return 'A capture leads to a decisive advantage.';
  return 'Find the best move for the winning side.';
}

function sideToMove(fen?: string): 'White' | 'Black' {
  if (!fen) return 'White';
  return fen.split(' ')[1] === 'b' ? 'Black' : 'White';
}

function getMessage(status: CoachStatus, node: PathNode | null): string {
  if (status === 'correct') return 'Excellent! You found the winning move.';
  if (status === 'wrong') {
    const sol = node?.solution?.trim() || '';
    if (sol.endsWith('#')) return "Not quite — the checkmate is still there. Look again.";
    return "That's not the right move. Think it through and try again.";
  }
  return deriveIdleHint(node);
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  idle: {
    label: 'Coach',
    color: 'text-brand-accent',
    Icon: Lightbulb,
    bg: 'rgba(212,175,110,0.08)',
    border: 'rgba(212,175,110,0.22)',
  },
  correct: {
    label: 'Correct!',
    color: 'text-emerald-400',
    Icon: CheckCircle2,
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.30)',
  },
  wrong: {
    label: 'Try Again',
    color: 'text-rose-400',
    Icon: XCircle,
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.28)',
  },
} as const;

// ── Full-height panel (desktop solve mode) ────────────────────────────────────

function CoachPanel({
  selectedNode,
  status,
  onBackToMap,
}: {
  selectedNode: PathNode | null;
  status: CoachStatus;
  onBackToMap?: () => void;
}) {
  const side = sideToMove(selectedNode?.fen);
  const cfg = STATUS_CONFIG[status];
  const message = getMessage(status, selectedNode);
  const { Icon } = cfg;

  return (
    <div
      className="w-full h-full flex flex-col rounded-2xl overflow-hidden border"
      style={{
        background:
          'linear-gradient(160deg, rgba(212,175,110,0.06) 0%, rgba(8,11,20,0.98) 65%)',
        borderColor: 'rgba(212,175,110,0.18)',
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(212,175,110,0.12)' }}
      >
        {onBackToMap ? (
          <button
            onClick={onBackToMap}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-brand-secondary hover:text-brand-accent transition-colors duration-200 cursor-pointer group"
          >
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
            Back to Map
          </button>
        ) : (
          <span />
        )}
        {selectedNode && (
          <span className="text-[9px] font-mono uppercase tracking-widest text-brand-secondary/60 select-none">
            Level {selectedNode.levelNumber}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col items-center px-5 pt-6 pb-4 flex-1 min-h-0">
        {/* Avatar */}
        <div
          className="w-24 h-24 rounded-2xl overflow-hidden border-2 mb-4 flex-shrink-0"
          style={{ borderColor: 'rgba(212,175,110,0.30)' }}
        >
          <img
            src="/coach.png"
            alt="Coach"
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* Puzzle title */}
        {selectedNode && (
          <p className="text-base font-display font-semibold text-brand-text text-center mb-1 tracking-wide">
            {selectedNode.title || `Level ${selectedNode.levelNumber}`}
          </p>
        )}

        {/* Side-to-move pill */}
        <div className="flex items-center gap-1.5 mb-5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: side === 'White' ? '#F5F0E8' : '#1c1c1c',
              border:
                side === 'White'
                  ? '1px solid rgba(212,175,110,0.4)'
                  : '1px solid rgba(255,255,255,0.15)',
            }}
          />
          <span className="text-[10px] font-mono uppercase tracking-widest text-brand-secondary">
            {side} to move
          </span>
        </div>

        {/* Animated status bubble */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full rounded-xl p-3.5 flex items-start gap-3"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
            }}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.color}`} />
            <div className="min-w-0">
              <p
                className={`text-[10px] font-mono uppercase tracking-widest mb-1 font-bold ${cfg.color}`}
              >
                {cfg.label}
              </p>
              <p className="text-xs text-brand-text font-sans leading-relaxed">
                {message}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer: rating */}
      {selectedNode?.rating && (
        <div className="px-5 pb-5 flex-shrink-0">
          <div
            className="flex items-center justify-center gap-2 pt-3 border-t"
            style={{ borderColor: 'rgba(212,175,110,0.10)' }}
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-secondary">
              Puzzle Rating
            </span>
            <span className="text-[10px] font-mono font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 rounded-full">
              {selectedNode.rating}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Compact strip (mobile board view) ─────────────────────────────────────────

function CoachStrip({
  selectedNode,
  status,
}: {
  selectedNode: PathNode | null;
  status: CoachStatus;
}) {
  const cfg = STATUS_CONFIG[status];
  const message = getMessage(status, selectedNode);
  const { Icon } = cfg;

  return (
    <div
      className="w-full rounded-2xl border flex items-center gap-4 px-4 py-3"
      style={{
        background:
          'linear-gradient(135deg, rgba(212,175,110,0.07) 0%, rgba(12,16,32,0.95) 100%)',
        borderColor: cfg.border,
        transition: 'border-color 0.25s ease',
      }}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-brand-accent/20 bg-brand-surface/60">
        <img
          src="/coach.png"
          alt="Coach"
          className="w-full h-full object-cover object-top"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Icon className={`w-3 h-3 ${cfg.color}`} />
          <p
            className={`text-[10px] font-mono uppercase tracking-widest font-bold ${cfg.color}`}
          >
            {cfg.label}
          </p>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={status}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="text-xs text-brand-text font-sans leading-snug"
          >
            {message}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function PuzzleCoach({
  selectedNode,
  status,
  onBackToMap,
  compact = false,
}: PuzzleCoachProps) {
  if (compact) {
    return <CoachStrip selectedNode={selectedNode} status={status} />;
  }
  return (
    <CoachPanel
      selectedNode={selectedNode}
      status={status}
      onBackToMap={onBackToMap}
    />
  );
}
