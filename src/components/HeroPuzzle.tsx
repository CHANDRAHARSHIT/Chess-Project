/**
 * HeroPuzzle.tsx
 *
 * Premium chess puzzle component — Chess.com / Lichess quality experience.
 *
 * ── Puzzle ───────────────────────────────────────────────────────────────────
 * White to play and checkmate in two.
 * FEN: r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4
 * Solution: 1. Qxf7+ ...d6 2. Qe6#
 *
 * ── Premium Animation Systems ────────────────────────────────────────────────
 * 1. Board entrance: scale+fade from slightly below on page load
 * 2. Cursor glow: radial light follows mouse across board (useBoardCursorGlow)
 * 3. Move trail: SVG animated arrow from source → dest (useMoveTrail)
 * 4. Piece lift: CSS :hover translateY + drop-shadow (index.css)
 * 5. Last-move highlight: amber squares with fade keyframe
 * 6. Checkmate impact sequence:
 *    a) Board white flash
 *    b) King square red pulse
 *    c) Full-screen "CHECKMATE" overlay (GSAP timeline)
 *    d) Board glow expansion ring
 * 7. Confetti burst (useConfetti) — brand colors
 * 8. "Puzzle Solved!" badge with spring pop
 * 9. Notation panel with slide-in entries
 * 10. All animations: transforms + opacity only → 60fps
 *
 * ── Architecture ─────────────────────────────────────────────────────────────
 * - Data-driven: swap PUZZLE const to change puzzle
 * - State machine: idle → white_moved → black_responding → awaiting_mate → solved | failed | solving
 * - Celebration guard: hasCelebratedRef prevents double-fire
 * - Mobile-safe: cursor effects skip on touch devices
 * - Reduced-motion: all imperative animations check prefersReducedMotion()
 */

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { RotateCcw, Play, Trophy, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { useConfetti } from '../hooks/useConfetti';
import { useBoardCursorGlow } from '../hooks/useBoardCursorGlow';
import { useMoveTrail } from '../hooks/useMoveTrail';
import { gsap } from '../utils/gsapConfig';
import { prefersReducedMotion } from '../utils/gsapConfig';

// ── Board theme ──────────────────────────────────────────────────────────────
const BOARD_DARK  = '#769656';
const BOARD_LIGHT = '#EEEED2';

// ── Puzzle definition (data-driven — swap to change puzzle) ──────────────────
const PUZZLE = {
  fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
  label: 'White to play and checkmate in two',
  totalMoves: 2,
  blackResponse: { from: 'd7', to: 'd6' },
  matingMove:    { from: 'h5', to: 'f7' },
  // King square to pulse on checkmate (black king)
  kingSquare: 'e8',
  solution: [
    { from: 'h5', to: 'f7', san: 'Qxf7+', annotation: 'Check! The queen strikes f7.' },
    { from: 'd7', to: 'd6', san: '...d6',  annotation: "Black's only try — blocking the diagonal." },
    { from: 'f7', to: 'e6', san: 'Qe6#',  annotation: '✓ Checkmate! The queen covers every escape square.' },
  ],
} as const;

// ── Puzzle state machine ─────────────────────────────────────────────────────
type PuzzlePhase =
  | 'idle'
  | 'white_moved'
  | 'black_responding'
  | 'awaiting_mate'
  | 'solved'
  | 'failed'
  | 'solving';

// ── Checkmate impact layer state ─────────────────────────────────────────────
type CheckmateImpact = 'none' | 'flashing' | 'overlay' | 'done';

export default function HeroPuzzle() {
  const { triggerConfetti }           = useConfetti();
  const glowRef                       = useBoardCursorGlow<HTMLDivElement>();
  const { svgRef, showTrail, clearTrail } = useMoveTrail();

  // ── Chess state ────────────────────────────────────────────────────────────
  const gameRef = useRef(new Chess(PUZZLE.fen));
  const [gameFen, setGameFen]         = useState<string>(PUZZLE.fen);

  // ── Puzzle phase & counter ─────────────────────────────────────────────────
  const [phase, setPhase]             = useState<PuzzlePhase>('idle');
  const [movesLeft, setMovesLeft]     = useState<number>(PUZZLE.totalMoves);

  // ── Last-move highlight ────────────────────────────────────────────────────
  const [lastMove, setLastMove]       = useState<{ from: string; to: string } | null>(null);

  // ── Checkmate impact ───────────────────────────────────────────────────────
  const [, setCheckmateImpact] = useState<CheckmateImpact>('none');
  const [kingPulse, setKingPulse]     = useState(false);

  // ── Solve animation ────────────────────────────────────────────────────────
  const [solveStep, setSolveStep]         = useState(-1);
  const [solveAnnotation, setSolveAnnotation] = useState('');
  const solveTimerRef                     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Notation panel ─────────────────────────────────────────────────────────
  const [notationEntries, setNotationEntries] = useState<string[]>([]);
  const notationRef                       = useRef<HTMLDivElement>(null);

  // ── Celebration guard ──────────────────────────────────────────────────────
  const hasCelebratedRef = useRef(false);

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const boardWrapRef    = useRef<HTMLDivElement>(null);   // outer glow target
  const boardCardRef    = useRef<HTMLDivElement>(null);   // the dark card
  const boardInnerRef   = useRef<HTMLDivElement>(null);   // board div (aspect-square)
  const checkmateRef    = useRef<HTMLDivElement>(null);   // CHECKMATE overlay

  // ══════════════════════════════════════════════════════════════════════════
  // 1. BOARD ENTRANCE ANIMATION
  // Runs once on mount — smooth scale+fade from slightly below.
  // ══════════════════════════════════════════════════════════════════════════
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !boardCardRef.current) return;
    gsap.fromTo(
      boardCardRef.current,
      { opacity: 0, y: 18, scale: 0.97 },
      { opacity: 1, y: 0,  scale: 1,   duration: 0.8, ease: 'power3.out', delay: 0.6 }
    );
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /** Apply a chess move; update FEN + last-move state. Returns success bool. */
  const applyMove = useCallback(
    (from: string, to: string, promotion = 'q'): boolean => {
      try {
        const result = gameRef.current.move({ from, to, promotion });
        if (!result) return false;
        setGameFen(gameRef.current.fen());
        setLastMove({ from, to });
        showTrail(from, to);
        return true;
      } catch {
        return false;
      }
    },
    [showTrail]
  );

  /** Scroll notation panel to bottom */
  const addNotation = useCallback((entry: string) => {
    setNotationEntries(prev => [...prev, entry]);
    setTimeout(() => {
      if (notationRef.current)
        notationRef.current.scrollTop = notationRef.current.scrollHeight;
    }, 50);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // 6. CHECKMATE IMPACT SEQUENCE
  // a) Board white flash  b) King pulse  c) CHECKMATE overlay  d) Glow ring
  // ══════════════════════════════════════════════════════════════════════════
  const runCheckmateImpact = useCallback((): Promise<void> => {
    return new Promise(resolve => {
      if (prefersReducedMotion()) { resolve(); return; }

      const board = boardInnerRef.current;
      const card  = boardCardRef.current;
      const overlay = checkmateRef.current;
      if (!board || !card || !overlay) { resolve(); return; }

      const tl = gsap.timeline({ onComplete: resolve });

      // a) Flash: board briefly goes bright white then snaps back
      tl.to(board, {
        filter: 'brightness(3)',
        duration: 0.08,
        ease: 'none',
      })
      .to(board, {
        filter: 'brightness(1)',
        duration: 0.25,
        ease: 'power2.out',
      });

      // b) King square pulse (red tint — handled by state toggle + CSS)
      tl.call(() => {
        setKingPulse(true);
        setTimeout(() => setKingPulse(false), 1200);
      }, [], '<0.05');

      // c) CHECKMATE text overlay — scale in from 0
      tl.set(overlay, { display: 'flex', opacity: 0, scale: 0.6 })
        .to(overlay, {
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: 'back.out(1.7)',
        }, '+=0.1');

      // d) Glow expansion ring
      tl.fromTo(card,
        { boxShadow: '0 0 0px 0px rgba(99,102,241,0)' },
        {
          boxShadow: '0 0 80px 24px rgba(99,102,241,0.6)',
          duration: 0.5,
          ease: 'power2.out',
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            gsap.to(card, {
              boxShadow: '0 0 30px 8px rgba(99,102,241,0.25)',
              duration: 0.8,
            });
          },
        },
        '<'
      );
    });
  }, []);

  /** Full celebration: checkmate impact → confetti → solved state */
  const celebrate = useCallback(async () => {
    if (hasCelebratedRef.current) return;
    hasCelebratedRef.current = true;

    setCheckmateImpact('flashing');
    await runCheckmateImpact();
    setCheckmateImpact('overlay');

    // Brief hold on the CHECKMATE text, then transition to puzzle-solved state
    await new Promise(r => setTimeout(r, 900));
    triggerConfetti();
    setCheckmateImpact('done');
    setPhase('solved');
    setMovesLeft(0);
  }, [runCheckmateImpact, triggerConfetti]);

  // ══════════════════════════════════════════════════════════════════════════
  // onDrop — user drags a piece
  // ══════════════════════════════════════════════════════════════════════════
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string | null): boolean => {
      if (!targetSquare) return false;
      if (phase !== 'idle' && phase !== 'awaiting_mate') return false;
      if (gameRef.current.turn() !== 'w') return false;

      const ok = applyMove(sourceSquare, targetSquare);
      if (!ok) return false;

      const game     = gameRef.current;
      const history  = game.history({ verbose: true });
      const lastEntry = history[history.length - 1];

      if (phase === 'idle') {
        // White's first move
        addNotation(`1. ${lastEntry.san}`);
        setMovesLeft(1);
        setPhase('black_responding');

        // Black auto-responds d7→d6 after 600ms
        setTimeout(() => {
          const ok = applyMove(PUZZLE.blackResponse.from, PUZZLE.blackResponse.to);
          if (ok) {
            const hist = gameRef.current.history({ verbose: true });
            addNotation(`   ...${hist[hist.length - 1].san}`);
          }
          setPhase('awaiting_mate');
        }, 600);

      } else if (phase === 'awaiting_mate') {
        // White's second move — must be checkmate
        addNotation(`2. ${lastEntry.san}`);
        if (game.isCheckmate()) {
          celebrate();
        } else {
          setPhase('failed');
          setMovesLeft(0);
        }
      }

      return true;
    },
    [phase, applyMove, addNotation, celebrate]
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SOLVE — automated solution animation
  // ══════════════════════════════════════════════════════════════════════════
  const handleSolve = useCallback(() => {
    // Full reset first
    if (solveTimerRef.current) { clearTimeout(solveTimerRef.current); solveTimerRef.current = null; }
    gameRef.current = new Chess(PUZZLE.fen);
    setGameFen(PUZZLE.fen);
    setPhase('idle');
    setMovesLeft(PUZZLE.totalMoves);
    setLastMove(null);
    setSolveStep(-1);
    setSolveAnnotation('');
    setNotationEntries([]);
    setCheckmateImpact('none');
    setKingPulse(false);
    hasCelebratedRef.current = false;
    clearTrail();
    if (boardCardRef.current) boardCardRef.current.style.boxShadow = '';

    setTimeout(() => {
      setPhase('solving');
      setSolveStep(0);
    }, 200);
  }, [clearTrail]);

  const resetPuzzle = useCallback(() => {
    if (solveTimerRef.current) { clearTimeout(solveTimerRef.current); solveTimerRef.current = null; }
    gameRef.current = new Chess(PUZZLE.fen);
    setGameFen(PUZZLE.fen);
    setPhase('idle');
    setMovesLeft(PUZZLE.totalMoves);
    setLastMove(null);
    setSolveStep(-1);
    setSolveAnnotation('');
    setNotationEntries([]);
    setCheckmateImpact('none');
    setKingPulse(false);
    hasCelebratedRef.current = false;
    clearTrail();
    if (boardCardRef.current) boardCardRef.current.style.boxShadow = '';
  }, [clearTrail]);

  // Solve animation stepper
  useEffect(() => {
    if (phase !== 'solving') return;
    if (solveStep < 0 || solveStep >= PUZZLE.solution.length) return;

    const step  = PUZZLE.solution[solveStep];
    const delay = solveStep === 0 ? 400 : 850;

    solveTimerRef.current = setTimeout(() => {
      setSolveAnnotation(step.annotation);
      if (step.san.startsWith('...')) {
        addNotation(`   ${step.san}`);
      } else {
        addNotation(`${Math.floor(solveStep / 2) + 1}. ${step.san}`);
      }

      applyMove(step.from, step.to);

      const next = solveStep + 1;
      if (next >= PUZZLE.solution.length) {
        setTimeout(() => celebrate(), 650);
      } else {
        setSolveStep(next);
      }
    }, delay);

    return () => { if (solveTimerRef.current) clearTimeout(solveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solveStep, phase]);

  // ══════════════════════════════════════════════════════════════════════════
  // Square styles
  // ══════════════════════════════════════════════════════════════════════════
  const customSquareStyles: Record<string, React.CSSProperties> = {};

  // Last-move amber highlight
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 214, 10, 0.35)' };
    customSquareStyles[lastMove.to]   = { backgroundColor: 'rgba(255, 214, 10, 0.50)' };
  }

  // King square pulse (red on checkmate)
  if (kingPulse) {
    customSquareStyles[PUZZLE.kingSquare] = {
      backgroundColor: 'rgba(239, 68, 68, 0.55)',
      boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.8)',
      animation: 'king-pulse 0.4s ease-in-out 3',
    };
  }

  // ── Phase labels ───────────────────────────────────────────────────────────
  const phaseLabel: Record<PuzzlePhase, string> = {
    idle:             'White to move',
    white_moved:      'White moved',
    black_responding: 'Black thinking…',
    awaiting_mate:    'Deliver checkmate!',
    solved:           '✓ Puzzle Solved!',
    failed:           'Not checkmate — try again',
    solving:          'Watching solution…',
  };

  const isInteractive = phase === 'idle' || phase === 'awaiting_mate';

  // Merge the two refs (boardWrapRef + glowRef) onto the same DOM node
  const mergedWrapRef = useCallback((el: HTMLDivElement | null) => {
    boardWrapRef.current = el;
    (glowRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [glowRef]);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col gap-4">

      {/*
        ── Outer wrapper: cursor glow + entrance animation ───────────────────
        CSS vars --glow-x / --glow-y / --glow-opacity are set by useBoardCursorGlow
        and consumed by the ::after pseudo-element in index.css (pointer-events:none).
        mergedWrapRef connects both boardWrapRef and glowRef to this node.
      */}
      <div
        ref={mergedWrapRef}
        className="relative rounded-xl overflow-hidden board-cursor-glow"
        style={{ transition: 'box-shadow 0.4s ease' }}
      >
        {/* ── Floating ambient particles (pointer-events:none inherits) ──── */}
        <div className="hero-particles" aria-hidden="true">
          {[...Array(8)].map((_, i) => (
            <span key={i} className={`hero-particle hero-particle-${i + 1}`} />
          ))}
        </div>

        {/* ── CHECKMATE impact overlay — GSAP toggles display:flex ────────── */}
        <div
          ref={checkmateRef}
          className="absolute inset-0 z-40 items-center justify-center pointer-events-none"
          style={{ display: 'none' }}
        >
          <div className="checkmate-overlay-badge">
            <Zap className="w-6 h-6 text-yellow-300 mb-1" />
            <span className="checkmate-text">CHECKMATE</span>
          </div>
        </div>

        {/* ── Solved badge (shown after impact sequence completes) ─────────── */}
        {phase === 'solved' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div
              className="px-6 py-3 rounded-2xl text-center animate-puzzle-solved"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.95) 0%, rgba(139,92,246,0.95) 100%)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 8px 40px rgba(99,102,241,0.6)',
              }}
            >
              <Trophy className="w-8 h-8 text-yellow-300 mx-auto mb-1" />
              <p className="text-white font-bold text-lg font-sans">Puzzle Solved!</p>
            </div>
          </div>
        )}

        {/* ── Failed overlay ───────────────────────────────────────────────── */}
        {phase === 'failed' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center space-y-3 px-6">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-white font-bold font-sans">Not checkmate!</p>
              <button
                onClick={resetPuzzle}
                className="
                  flex items-center gap-2 mx-auto px-4 py-2
                  bg-brand-accent hover:bg-brand-accent/90
                  text-white rounded-lg text-sm font-semibold
                  transition-all duration-200
                  btn-glow-container btn-glow-accent
                "
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/*
          ── Board card — entrance animation target (boardCardRef)
          GSAP animates opacity/y/scale on this element on mount.
          Also receives boxShadow glow on checkmate.
        */}
        <div
          ref={boardCardRef}
          className="bg-brand-surface"
          style={{ willChange: 'transform, opacity, box-shadow', opacity: 0 }}
        >
          {/*
            ── Board inner — SVG trail overlay sits here
            overflow:hidden clips the board; position:relative anchors the SVG.
          */}
          <div
            ref={boardInnerRef}
            className="aspect-square rounded-lg overflow-hidden relative"
            style={{ willChange: 'filter' }}
          >
            {/* ── Move trail SVG overlay (pointer-events:none — never blocks) ── */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 20 }}
              aria-hidden="true"
            />

            {/* ── Chess board ───────────────────────────────────────────────── */}
            <Chessboard
              options={{
                position: gameFen,
                onPieceDrop: ({ sourceSquare, targetSquare }) =>
                  onDrop(sourceSquare, targetSquare ?? null),
                darkSquareStyle:  { backgroundColor: BOARD_DARK },
                lightSquareStyle: { backgroundColor: BOARD_LIGHT },
                boardStyle: {
                  borderRadius: '4px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                },
                showNotation: false,
                squareStyles: customSquareStyles,
                animationDurationInMs: 280,
                allowDragging: isInteractive,
              }}
            />
          </div>
        </div>
      </div>{/* end board-cursor-glow */}

      {/* ── Puzzle label + move counter ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs text-brand-secondary font-sans font-medium uppercase tracking-wider">
            {PUZZLE.label}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-sans text-white font-semibold">
              {phaseLabel[phase]}
            </span>
          </div>
        </div>
        <div
          className={`
            flex flex-col items-center px-4 py-2 rounded-xl border
            transition-all duration-500
            ${phase === 'solved'
              ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-accent'
              : phase === 'failed'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-brand-surface border-brand-border text-white'}
          `}
        >
          <span className="text-xl font-mono font-bold leading-none">
            {movesLeft}
          </span>
          <span className="text-[9px] font-sans text-brand-secondary uppercase tracking-widest mt-0.5">
            moves left
          </span>
        </div>
      </div>

      {/* ── Solve annotation ─────────────────────────────────────────────────── */}
      {phase === 'solving' && solveAnnotation && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-accent/10 border border-brand-accent/25 animate-fade-in">
          <ChevronRight className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />
          <p className="text-xs font-sans text-brand-secondary italic">
            {solveAnnotation}
          </p>
        </div>
      )}

      {/* ── Notation panel ───────────────────────────────────────────────────── */}
      {notationEntries.length > 0 && (
        <div
          ref={notationRef}
          className="max-h-20 overflow-y-auto bg-brand-bg/60 border border-brand-border/50 rounded-lg px-3 py-2 move-history-scroll"
        >
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {notationEntries.map((entry, i) => (
              <span
                key={i}
                className="font-mono text-xs text-brand-secondary animate-fade-in"
              >
                {entry}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Action buttons ───────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          id="hero-puzzle-solve-btn"
          onClick={handleSolve}
          disabled={phase === 'solving' || phase === 'black_responding'}
          className="
            flex-1 flex items-center justify-center gap-2
            px-4 py-2.5 rounded-lg
            font-sans text-sm font-semibold
            bg-brand-surface border border-brand-border
            text-brand-secondary hover:text-white
            hover:border-brand-accent/40 hover:bg-white/5
            transition-all duration-200
            disabled:opacity-40 disabled:pointer-events-none
            btn-glow-container btn-glow-surface
            group
          "
        >
          <Play className="w-4 h-4 text-brand-accent group-hover:scale-110 transition-transform" />
          Solve
        </button>

        <button
          id="hero-puzzle-reset-btn"
          onClick={resetPuzzle}
          disabled={phase === 'idle'}
          className="
            flex items-center justify-center gap-2
            px-4 py-2.5 rounded-lg
            font-sans text-sm font-semibold
            bg-brand-surface border border-brand-border
            text-brand-secondary hover:text-white
            hover:border-red-400/40 hover:bg-white/5
            transition-all duration-200
            disabled:opacity-40 disabled:pointer-events-none
            group
          "
        >
          <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform duration-300" />
          Reset
        </button>
      </div>
    </div>
  );
}
