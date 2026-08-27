import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import type { PathNode } from '@/features/puzzles/pathway.types';
import type { CuratedPuzzle } from '@/features/puzzles/puzzle.types';

export type CoachStatus = 'idle' | 'correct' | 'wrong';

interface PuzzleCoachProps {
  selectedNode: PathNode | null;
  status: CoachStatus;
  onBackToMap?: () => void;
  compact?: boolean;
}

function deriveIdleHint(node: PathNode | null): string {
  if (!node) return 'Select a puzzle from the map to begin.';
  if (node.description) return node.description;

  const sol = node.solution?.trim() || '';
  const title = node.title?.trim() || '';

  // Use the puzzle's title as the primary context so every level
  // shows a unique message — all Royal Gold puzzles end with '#'
  // so falling through to the solution check gives the same string each time.
  if (title) {
    if (sol.endsWith('#')) return `The theme is "${title}". Can you spot the checkmate?`;
    if (sol.includes('x')) return `The theme is "${title}". A capture leads the way.`;
    return `The theme is "${title}". Find the winning move.`;
  }

  // Fallback when no title is set
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

function difficultyLabel(rating?: number): string {
  if (!rating) return '';
  if (rating < 800) return 'Beginner';
  if (rating < 1400) return 'Intermediate';
  if (rating < 2000) return 'Advanced';
  return 'Master';
}

// Fixed palette — this panel is always dark, regardless of app theme
const PALETTE = {
  textPrimary: '#F5F0E8',
  textSecondary: 'rgba(245,240,232,0.55)',
  textMuted: 'rgba(245,240,232,0.38)',
  accent: '#D4AF6E',
  panelBg: '#0B0E17',
  pillBg: 'rgba(255,255,255,0.04)',
  pillBorder: 'rgba(255,255,255,0.08)',
};

const STATUS_CONFIG = {
  idle: {
    label: 'Coach',
    color: PALETTE.accent,
    Icon: Lightbulb,
    bg: 'rgba(212,175,110,0.10)',
    border: 'rgba(212,175,110,0.28)',
  },
  correct: {
    label: 'Correct!',
    color: '#34D399',
    Icon: CheckCircle2,
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.32)',
  },
  wrong: {
    label: 'Try Again',
    color: '#F87171',
    Icon: XCircle,
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.30)',
  },
} as const;

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
  const diff = difficultyLabel(selectedNode?.rating);
  const { Icon } = cfg;

  return (
    <div
      className="w-full h-full flex flex-col rounded-2xl overflow-hidden border relative"
      style={{ background: PALETTE.panelBg, borderColor: 'rgba(212,175,110,0.18)' }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(212,175,110,0.12)' }}
      >
        {onBackToMap ? (
          <button
            onClick={onBackToMap}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors duration-200 cursor-pointer group"
            style={{ color: PALETTE.textSecondary }}
          >
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
            Back to Map
          </button>
        ) : (
          <span />
        )}
        {selectedNode && (
          <span
            className="text-[9px] font-mono uppercase tracking-widest select-none"
            style={{ color: PALETTE.textMuted }}
          >
            Level {selectedNode.levelNumber}
          </span>
        )}
      </div>

      {/* Body — centered column */}
      <div className="flex flex-col items-center justify-center text-center px-5 pt-6 pb-4 flex-1 min-h-0 mx-auto w-full max-w-[280px]">
        {/* Avatar */}
        <div
          className="w-24 h-24 rounded-2xl overflow-hidden border-2 mb-4 flex-shrink-0"
          style={{ borderColor: 'rgba(212,175,110,0.30)' }}
        >
          <img src="/coach.png" alt="Coach" className="w-full h-full object-cover object-top" />
        </div>

        {/* Puzzle title */}
        {selectedNode && (
          <p
            className="text-base font-display font-semibold text-center mb-1 tracking-wide"
            style={{ color: PALETTE.textPrimary }}
          >
            {selectedNode.title || `Level ${selectedNode.levelNumber}`}
          </p>
        )}

        {/* Side-to-move + difficulty pills */}
        <div className="flex items-center gap-2 mb-5 flex-wrap justify-center">
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
            style={{ background: PALETTE.pillBg, borderColor: PALETTE.pillBorder }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: side === 'White' ? '#F5F0E8' : '#1c1c1c',
                border: side === 'White' ? '1px solid rgba(212,175,110,0.4)' : '1px solid rgba(255,255,255,0.15)',
              }}
            />
            <span
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: PALETTE.textSecondary }}
            >
              {side} to move
            </span>
          </div>
          {diff && (
            <div
              className="rounded-full px-2.5 py-1 border"
              style={{ background: 'rgba(212,175,110,0.08)', borderColor: 'rgba(212,175,110,0.18)' }}
            >
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: 'rgba(212,175,110,0.85)' }}
              >
                {diff}
              </span>
            </div>
          )}
        </div>

        {/* Animated status bubble */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full rounded-xl p-3.5 flex items-start gap-3 text-left"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
            <div className="min-w-0">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1 font-bold"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </p>
              <p
                className="text-xs font-sans leading-relaxed"
                style={{ color: PALETTE.textPrimary }}
              >
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
            <span
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: PALETTE.textSecondary }}
            >
              Puzzle Rating
            </span>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
              style={{ color: PALETTE.accent, background: 'rgba(212,175,110,0.12)', border: '1px solid rgba(212,175,110,0.25)' }}
            >
              {selectedNode.rating}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

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
        background: 'linear-gradient(135deg, rgba(212,175,110,0.10) 0%, #0B0E17 100%)',
        borderColor: cfg.border,
      }}
    >
      <div
        className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border"
        style={{ borderColor: 'rgba(212,175,110,0.25)', background: 'rgba(255,255,255,0.03)' }}
      >
        <img src="/coach.png" alt="Coach" className="w-full h-full object-cover object-top" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Icon className="w-3 h-3" style={{ color: cfg.color }} />
          <p
            className="text-[10px] font-mono uppercase tracking-widest font-bold"
            style={{ color: cfg.color }}
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
            className="text-xs font-sans leading-snug"
            style={{ color: PALETTE.textPrimary }}
          >
            {message}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function PuzzleCoach({
  selectedNode,
  status,
  onBackToMap,
  compact = false,
}: PuzzleCoachProps) {
  if (compact) {
    return <CoachStrip selectedNode={selectedNode} status={status} />;
  }
  return <CoachPanel selectedNode={selectedNode} status={status} onBackToMap={onBackToMap} />;
}

// ─── Custom Puzzle Coach ─────────────────────────────────────────────────────
// A self-contained coach panel for the Custom Puzzles flow.
// It accepts a raw CuratedPuzzle and derives display context from it.

/**
 * Converts a raw Lichess theme tag into human-readable text using only
 * string transformation — no lookup table.
 *   "hangingPiece" → "Hanging Piece"
 *   "mateIn2"      → "Mate In 2"
 *   "xRayAttack"   → "X Ray Attack"
 */
function formatThemeLabel(theme: string): string {
  return theme
    // Insert a space before each uppercase letter (camelCase split)
    .replace(/([A-Z])/g, ' $1')
    // Insert a space before a digit sequence that follows a letter
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    // Trim any leading space produced by the first rule
    .trim()
    // Capitalise the very first character
    .replace(/^./, (s) => s.toUpperCase());
}

// Tags that convey very little tactical specificity on their own.
// They are deprioritised if any more specific theme is present.
const LOW_SIGNAL_THEMES = new Set([
  'middlegame', 'endgame', 'opening',
  'advantage', 'equality', 'crushing',
  'long', 'short', 'master', 'superGM',
]);

/**
 * Builds a unique idle hint for a custom puzzle derived entirely from its
 * own `themes` array — no per-theme hardcoded sentences.
 *
 * Algorithm:
 *   1. Return a default message when puzzle is null or themes is empty.
 *   2. Filter out low-signal tags when more specific ones are available.
 *   3. Take up to the first 2 remaining themes.
 *   4. Convert them with formatThemeLabel and join into a template message.
 */
function deriveCustomIdleHint(puzzle: CuratedPuzzle | null): string {
  if (!puzzle) return 'Select a puzzle to begin.';
  const themes = puzzle.themes ?? [];
  if (themes.length === 0) {
    // No theme data — fall back to move-count inference
    const moveList = (puzzle.moves ?? '').trim().split(/\s+/).filter(Boolean);
    const playerMoves = moveList.slice(1);
    const hasPromotion = playerMoves.some((m) => /[qrbn]$/i.test(m));
    if (hasPromotion) return 'A pawn can promote. Find the winning path.';
    const count = playerMoves.length;
    if (count === 1) return 'One precise move decides the game. Find it.';
    if (count === 2) return 'A two-move combination wins. Calculate both moves.';
    if (count >= 3) return 'A multi-move combination. Work out the full sequence.';
    return 'Find the best move for the winning side.';
  }

  // Prefer specific themes over generic/context ones
  const specific = themes.filter((t) => !LOW_SIGNAL_THEMES.has(t));
  const pool = specific.length > 0 ? specific : themes;

  // Take at most 2 themes to keep the message concise
  const picked = pool.slice(0, 2);
  const labels = picked.map(formatThemeLabel);

  if (labels.length === 1) {
    return `Theme: ${labels[0]}. Find the winning move.`;
  }
  return `Theme: ${labels[0]} + ${labels[1]}. Find the winning move.`;
}

function getCustomMessage(status: CoachStatus, puzzle: CuratedPuzzle | null): string {
  if (status === 'correct') return 'Excellent! You found the winning move.';
  if (status === 'wrong') {
    const themes = puzzle?.themes ?? [];
    if (themes.some((t) => /mate/i.test(t)))
      return "Not quite — the checkmate is still there. Look again.";
    if (themes.some((t) => t === 'fork'))
      return "The fork is still available. Find the square that attacks two pieces.";
    if (themes.some((t) => t === 'pin'))
      return "Think about which piece is pinned and how to press that advantage.";
    return "That's not the right move. Think it through and try again.";
  }
  // idle — fully derived from the puzzle's own data, no static fallback strings
  return deriveCustomIdleHint(puzzle);
}

function customSideToMove(fen?: string): 'White' | 'Black' {
  if (!fen) return 'White';
  // CuratedPuzzle.fen is the position BEFORE the opponent's first move.
  // After convertPuzzle applies that first move, the active side flips.
  // We receive the puzzle's *original* fen here and need the side that
  // the PLAYER will move — which is the OPPOSITE of the fen's active color.
  const fenSide = fen.split(' ')[1];
  return fenSide === 'b' ? 'White' : 'Black';
}

function customDifficultyLabel(rating?: number): string {
  if (!rating) return '';
  if (rating < 800) return 'Beginner';
  if (rating < 1400) return 'Intermediate';
  if (rating < 2000) return 'Advanced';
  return 'Master';
}

function getCustomTitle(puzzle: CuratedPuzzle): string {
  const themes = puzzle.themes ?? [];
  const mateTag = themes.find((t) => /^mateIn(\d)$/.test(t));
  if (mateTag) return `Checkmate in ${mateTag.replace('mateIn', '')}`;
  if (themes.length > 0) {
    const label = themes[0].replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
    return label;
  }
  // Infer from moves when no themes
  const moveList = (puzzle.moves ?? '').trim().split(/\s+/).filter(Boolean);
  const playerMoves = moveList.slice(1);
  const hasPromotion = playerMoves.some((m) => /[qrbn]$/i.test(m));
  if (hasPromotion) return 'Promotion Puzzle';
  const count = playerMoves.length;
  if (count === 1) return 'One Move';
  if (count === 2) return 'Two-Move Combo';
  if (count >= 3) return 'Combination';
  return 'Tactics Puzzle';
}

interface CustomPuzzleCoachProps {
  puzzle: CuratedPuzzle | null;
  status: CoachStatus;
  onExit?: () => void;
}

export function CustomPuzzleCoach({ puzzle, status, onExit }: CustomPuzzleCoachProps) {
  const cfg = STATUS_CONFIG[status];
  const { Icon } = cfg;
  const message = getCustomMessage(status, puzzle);
  const side = customSideToMove(puzzle?.fen);
  const diff = customDifficultyLabel(puzzle?.rating);
  const title = puzzle ? getCustomTitle(puzzle) : null;

  return (
    <div
      className="w-full flex flex-col rounded-2xl overflow-hidden border relative"
      style={{ background: PALETTE.panelBg, borderColor: 'rgba(212,175,110,0.18)' }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(212,175,110,0.12)' }}
      >
        {onExit ? (
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors duration-200 cursor-pointer group"
            style={{ color: PALETTE.textSecondary }}
          >
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
            Exit Session
          </button>
        ) : (
          <span />
        )}
        {puzzle?.rating && (
          <span
            className="text-[9px] font-mono uppercase tracking-widest select-none px-2 py-0.5 rounded-full"
            style={{
              color: PALETTE.accent,
              background: 'rgba(212,175,110,0.10)',
              border: '1px solid rgba(212,175,110,0.22)',
            }}
          >
            {puzzle.rating}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col items-center text-center px-5 pt-6 pb-4 gap-4">
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0"
          style={{ borderColor: 'rgba(212,175,110,0.30)' }}
        >
          <img src="/coach.png" alt="Coach" className="w-full h-full object-cover object-top" />
        </div>

        {/* Puzzle title */}
        {title && (
          <p
            className="text-sm font-display font-semibold tracking-wide"
            style={{ color: PALETTE.textPrimary }}
          >
            {title}
          </p>
        )}

        {/* Side-to-move + difficulty pills */}
        {puzzle && (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
              style={{ background: PALETTE.pillBg, borderColor: PALETTE.pillBorder }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: side === 'White' ? '#F5F0E8' : '#1c1c1c',
                  border: side === 'White' ? '1px solid rgba(212,175,110,0.4)' : '1px solid rgba(255,255,255,0.15)',
                }}
              />
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: PALETTE.textSecondary }}
              >
                {side} to move
              </span>
            </div>
            {diff && (
              <div
                className="rounded-full px-2.5 py-1 border"
                style={{ background: 'rgba(212,175,110,0.08)', borderColor: 'rgba(212,175,110,0.18)' }}
              >
                <span
                  className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: 'rgba(212,175,110,0.85)' }}
                >
                  {diff}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Animated status bubble */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full rounded-xl p-3.5 flex items-start gap-3 text-left"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
            <div className="min-w-0">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1 font-bold"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </p>
              <p
                className="text-xs font-sans leading-relaxed"
                style={{ color: PALETTE.textPrimary }}
              >
                {message}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}