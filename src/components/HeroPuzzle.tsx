/**
 * HeroPuzzle.tsx
 *
 * Premium chess puzzle component — Chess.com / Lichess quality experience.
 *
 * ── Puzzle ───────────────────────────────────────────────────────────────────
 * White to play and check mate in two.
 * FEN: 2kr4/K1pp4/8/8/8/8/7Q/3R4 w - - 0 1
 * Position: White Ka7 Qh2 Rd1 | Black Kc8 Rd8 Pc7 Pd7
 * Solution: 1. Qb8+! Rxb8 2. Rd8#
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
import { useMoveAnnotation } from '../hooks/useMoveAnnotation';
import { MoveAnnotation } from './MoveAnnotation';

// ── Board theme ──────────────────────────────────────────────────────────────
const BOARD_DARK  = '#769656';
const BOARD_LIGHT = '#EEEED2';

// ── Puzzle definition (data-driven — swap to change puzzle) ──────────────────
const PUZZLE = {
  // Position: White Ka7 Qh2 Rd1 | Black Kc8 Rd8 Pc7 Pd7 | White to move
  // Generated via chess.js load() from hardcoded FEN — NOT derived from move history
  fen: '2kr4/K1pp4/8/8/8/8/7Q/3R4 w - - 0 1',
  label: 'White to play and check mate in two',
  totalMoves: 2,
  blackResponse: { from: 'c7', to: 'd6' },
  matingMove:    { from: 'd1', to: 'c1' },
  // King square to pulse on checkmate (black king)
  kingSquare: 'c8',
  solution: [
    { from: 'h2', to: 'd6', san: 'Qd6',   annotation: 'Brilliant! The queen sacrifices herself on d6.', animate: true },
    { from: 'c7', to: 'd6', san: '...cxd6', annotation: "Black is forced to capture.", animate: true },
    { from: 'd1', to: 'c1', san: 'Rc1#',   annotation: '✓ Checkmate! The rook delivers the final blow.', animate: true },
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
  const { fireConfetti } = useConfetti();
  const glowRef                       = useBoardCursorGlow<HTMLDivElement>();
  const { svgRef, showTrail, clearTrail } = useMoveTrail();
  const { activeAnnotation, triggerAnnotation, clearAnnotation } = useMoveAnnotation();

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
  const [, setSolveStep]         = useState(-1);
  const [solveAnnotation, setSolveAnnotation] = useState('');
  const solveTimerRef                     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const solveAbortRef                     = useRef(false);

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

  const animatePieceMove = useCallback((
    fromSq: string,
    toSq: string,
    boardEl: HTMLDivElement | null
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (prefersReducedMotion() || !boardEl) { resolve(); return; }

      const getSquareCenter = (sq: string) => {
        const el = boardEl.querySelector(`[data-square="${sq}"]`) as HTMLElement | null;
        if (!el) return null;
        const br = boardEl.getBoundingClientRect();
        const sr = el.getBoundingClientRect();
        return { x: sr.left + sr.width / 2 - br.left, y: sr.top + sr.height / 2 - br.top };
      };

      const from = getSquareCenter(fromSq);
      const to   = getSquareCenter(toSq);
      const pieceEl = boardEl.querySelector(
        `[data-square="${fromSq}"] [data-testid^="piece-"]`
      ) as HTMLElement | null;

      if (!pieceEl || !from || !to) { resolve(); return; }

      // Clean up any stray ghosts before starting
      boardEl.querySelectorAll('.gsap-moving').forEach((el) => {
        if (el !== boardEl) {
          el.remove();
        }
      });

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Perpendicular arc offset for curved path
      const arcAmt = dist * 0.15;
      const perpX = dist > 0 ? (-dy / dist) * arcAmt : 0;
      const perpY = dist > 0 ? ( dx / dist) * arcAmt : 0;
      
      const controlX = dx / 2 + perpX;
      const controlY = dy / 2 + perpY;

      // Add gsap-moving class to the piece to exempt it from index.css !important transforms
      pieceEl.classList.add('gsap-moving');

      // Ghost trail clone
      boardEl.style.position = 'relative';
      const ghost = pieceEl.cloneNode(true) as HTMLElement;
      ghost.classList.add('gsap-moving');
      ghost.style.cssText = `
        position:absolute; pointer-events:none; z-index:15;
        left:${from.x - pieceEl.offsetWidth / 2}px;
        top:${from.y - pieceEl.offsetHeight / 2}px;
        width:${pieceEl.offsetWidth}px;
        height:${pieceEl.offsetHeight}px;
        opacity:0.25; filter:blur(1px); transform:none;
      `;
      boardEl.appendChild(ghost);

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(pieceEl, { clearProps: 'all' });
          pieceEl.classList.remove('gsap-moving');
          ghost.remove();
          resolve();
        },
      });

      // 1) Scale up 1 → 1.08 immediately
      tl.to(pieceEl, {
        scale: 1.08,
        duration: 0.08,
        ease: 'power2.out',
        transformOrigin: 'center center',
      });

      // 2) Curved move using quadratic bezier curve math (duration 0.45s, ease power3.out)
      const pathObj = { t: 0 };
      tl.to(pathObj, {
        t: 1,
        duration: 0.45,
        ease: 'power3.out',
        onUpdate: () => {
          const t = pathObj.t;
          const curX = 2 * (1 - t) * t * controlX + t * t * dx;
          const curY = 2 * (1 - t) * t * controlY + t * t * dy;
          gsap.set(pieceEl, { x: curX, y: curY });
        }
      }, 0);

      // 3) Ghost trail follows the same curved path with 0.05s lag, fading out
      const ghostObj = { t: 0 };
      gsap.set(ghost, { scale: 1.08 });
      tl.to(ghostObj, {
        t: 1,
        duration: 0.45,
        ease: 'power3.out',
        onUpdate: () => {
          const t = ghostObj.t;
          const curX = 2 * (1 - t) * t * controlX + t * t * dx;
          const curY = 2 * (1 - t) * t * controlY + t * t * dy;
          gsap.set(ghost, {
            x: curX,
            y: curY,
            opacity: 0.25 * (1 - t)
          });
        }
      }, 0.05);

      // 4) Landing bounce: starts exactly at 0.45s when piece finishes moving
      tl.to(pieceEl, {
        scale: 0.95,
        duration: 0.06,
        ease: 'power1.in',
      }, 0.45);
      tl.to(pieceEl, {
        scale: 1.02,
        duration: 0.05,
        ease: 'power1.out',
      });
      tl.to(pieceEl, {
        scale: 1,
        duration: 0.04,
        ease: 'none',
      });
    });
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
    fireConfetti();
    setCheckmateImpact('done');
    setPhase('solved');
    setMovesLeft(0);
  }, [runCheckmateImpact, fireConfetti]);

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
        // White's first move — strip capture 'x' for clean display
        const displaySan = lastEntry.san.replace('x', '');
        addNotation(`1. ${displaySan}`);

        // Check if this move is already checkmate (e.g., Qb7# or Rd8#)
        if (game.isCheckmate()) {
          setMovesLeft(0);
          triggerAnnotation(targetSquare, '!!');
          celebrate();
          return true;
        }

        setMovesLeft(1);
        setPhase('black_responding');

        // Show White first move annotation !?
        triggerAnnotation(targetSquare, '!?');

        // Black auto-responds after 600ms
        setTimeout(() => {
          const ok = applyMove(PUZZLE.blackResponse.from, PUZZLE.blackResponse.to);
          if (ok) {
            const hist = gameRef.current.history({ verbose: true });
            const blackSan = hist[hist.length - 1].san.replace('x', '');
            addNotation(`   ...${blackSan}`);
            // Show Black move annotation ?
            triggerAnnotation(PUZZLE.blackResponse.to, '?');
          }
          setPhase('awaiting_mate');
        }, 600);

      } else if (phase === 'awaiting_mate') {
        // White's second move — strip capture 'x' for clean display
        const displaySan = lastEntry.san.replace('x', '');
        addNotation(`2. ${displaySan}`);
        if (game.isCheckmate()) {
          // Show White final mating move annotation !!
          triggerAnnotation(targetSquare, '!!');
          celebrate();
        } else {
          setPhase('failed');
          setMovesLeft(0);
        }
      }

      return true;
    },
    [phase, applyMove, addNotation, celebrate, triggerAnnotation]
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED RESET HELPER
  // ══════════════════════════════════════════════════════════════════════════
  const fullReset = useCallback(() => {
    if (solveTimerRef.current) { clearTimeout(solveTimerRef.current); solveTimerRef.current = null; }
    solveAbortRef.current = true;
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
    clearAnnotation();
    if (boardInnerRef.current) {
      boardInnerRef.current.querySelectorAll('.gsap-moving').forEach((el) => {
        if (el !== boardInnerRef.current) el.remove();
      });
    }
    if (boardCardRef.current) boardCardRef.current.style.boxShadow = '';
    if (checkmateRef.current) {
      gsap.killTweensOf(checkmateRef.current);
      gsap.set(checkmateRef.current, { display: 'none', opacity: 0, scale: 0.6 });
    }
  }, [clearTrail, clearAnnotation]);

  // ══════════════════════════════════════════════════════════════════════════
  // SOLVE — sequential async animation (replaces old useEffect stepper)
  // Each step: animate piece → commit board state → pause → next step.
  // ══════════════════════════════════════════════════════════════════════════
  const handleSolve = useCallback(async () => {
    fullReset();

    // Wait for reset render to flush
    await new Promise(r => { solveTimerRef.current = setTimeout(r, 300); });

    solveAbortRef.current = false;
    setPhase('solving');

    console.log('[Solve] Starting. FEN:', gameRef.current.fen());

    for (let i = 0; i < PUZZLE.solution.length; i++) {
      if (solveAbortRef.current) { console.log('[Solve] Aborted'); return; }

      const step = PUZZLE.solution[i];

      // Inter-move delay — let the viewer breathe
      await new Promise(r => {
        solveTimerRef.current = setTimeout(r, i === 0 ? 500 : 900);
      });
      if (solveAbortRef.current) return;

      // ── Update UI for this step ──────────────────────────────────────────
      setSolveStep(i);
      setSolveAnnotation(step.annotation);

      if (step.san.startsWith('...')) {
        addNotation(`   ${step.san}`);
      } else {
        addNotation(`${Math.floor(i / 2) + 1}. ${step.san}`);
      }

      // ── Animate the piece (GSAP: grow → curved move → trail → settle) ───
      if (step.animate) {
        await animatePieceMove(step.from, step.to, boardInnerRef.current);
      }
      if (solveAbortRef.current) return;

      // ── Commit board state AFTER animation completes ────────────────────
      const ok = applyMove(step.from, step.to);
      console.log(`[Solve] ${step.san} | ${ok ? 'OK' : 'FAILED'} | FEN: ${gameRef.current.fen()}`);

      // ── Update moves counter (white moves only: step 0, step 2) ─────────
      if (i === 0) setMovesLeft(1);

      // ── Annotation badge ────────────────────────────────────────────────
      if (i === 0) triggerAnnotation(step.to, '!?');
      else if (i === 1) triggerAnnotation(step.to, '?');
      else if (i === 2) triggerAnnotation(step.to, '!!');

      // ── Post-move pause so the viewer sees the result ───────────────────
      if (step.animate) {
        await new Promise(r => { solveTimerRef.current = setTimeout(r, 350); });
      }
    }

    if (solveAbortRef.current) return;

    console.log('[Solve] Complete. Final FEN:', gameRef.current.fen());
    setMovesLeft(0);

    // Celebration after a brief hold
    await new Promise(r => { solveTimerRef.current = setTimeout(r, 650); });
    if (!solveAbortRef.current) {
      celebrate();
    }
  }, [fullReset, addNotation, animatePieceMove, applyMove, triggerAnnotation, celebrate]);

  const resetPuzzle = useCallback(() => {
    fullReset();
  }, [fullReset]);

  // ── Magnetic piece hover effect ────────────────────────────────────────────
  useEffect(() => {
    const board = boardInnerRef.current;
    if (!board || prefersReducedMotion()) return;

    let activePiece: HTMLElement | null = null;

    const onMouseMove = (e: MouseEvent) => {
      const piece = (e.target as HTMLElement).closest('[data-testid^="piece-"]') as HTMLElement | null;
      
      if (piece) {
        if (activePiece && activePiece !== piece) {
          activePiece.style.setProperty('--mag-x', '0px');
          activePiece.style.setProperty('--mag-y', '0px');
        }
        activePiece = piece;
        
        const rect = piece.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        
        piece.style.setProperty('--mag-x', `${(dx * 0.25).toFixed(1)}px`);
        piece.style.setProperty('--mag-y', `${(dy * 0.25).toFixed(1)}px`);
      } else {
        if (activePiece) {
          activePiece.style.setProperty('--mag-x', '0px');
          activePiece.style.setProperty('--mag-y', '0px');
          activePiece = null;
        }
      }
    };

    const onMouseLeave = () => {
      if (activePiece) {
        activePiece.style.setProperty('--mag-x', '0px');
        activePiece.style.setProperty('--mag-y', '0px');
        activePiece = null;
      }
    };

    board.addEventListener('mousemove', onMouseMove);
    board.addEventListener('mouseleave', onMouseLeave);

    return () => {
      board.removeEventListener('mousemove', onMouseMove);
      board.removeEventListener('mouseleave', onMouseLeave);
      if (activePiece) {
        activePiece.style.setProperty('--mag-x', '0px');
        activePiece.style.setProperty('--mag-y', '0px');
      }
    };
  }, []);

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
          {['♞', '♝', '♜', '♟', '♞', '♝', '♜', '♟'].map((symbol, i) => (
            <span key={i} className={`hero-particle hero-particle-${i + 1}`}>
              {symbol}
            </span>
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
          style={{ willChange: 'transform, opacity, box-shadow', opacity: 0, transformStyle: 'preserve-3d' }}
        >
          {/*
            ── Board inner — SVG trail overlay sits here
            overflow:hidden clips the board; position:relative anchors the SVG.
          */}
          <div
            ref={boardInnerRef}
            className="aspect-square rounded-lg overflow-hidden relative"
            style={{ willChange: 'filter', transform: 'translateZ(24px)', transformStyle: 'preserve-3d' }}
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
                animationDurationInMs: phase === 'solving' ? 0 : 280,
                allowDragging: isInteractive,
              }}
            />

            {/* ── Move Quality Annotation Badge ── */}
            <MoveAnnotation activeAnnotation={activeAnnotation} />
          </div>
        </div>
      </div>{/* end board-cursor-glow */}

      {/* ── Below-board label: White to play + moves counter ──────────────── */}
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
