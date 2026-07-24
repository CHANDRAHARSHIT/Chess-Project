/**
 * HeroPuzzle.tsx
 *
 * Premium chess puzzle component â€” Chess.com / Lichess quality experience.
 *
 * â”€â”€ Puzzle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * White to play and check mate in two.
 * FEN: 2kr4/K1pp4/8/8/8/8/7Q/3R4 w - - 0 1
 * Position: White Ka7 Qh2 Rd1 | Black Kc8 Rd8 Pc7 Pd7
 * Solution: 1. Qb8+! Rxb8 2. Rd8#
 *
 * â”€â”€ Premium Animation Systems â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * 1. Board entrance: scale+fade from slightly below on page load
 * 2. Cursor glow: radial light follows mouse across board (useBoardCursorGlow)
 * 3. Move trail: SVG animated arrow from source â†’ dest (useMoveTrail)
 * 4. Piece lift: CSS :hover translateY + drop-shadow (index.css)
 * 5. Last-move highlight: amber squares with fade keyframe
 * 6. Checkmate impact sequence:
 *    a) Board white flash
 *    b) King square red pulse
 *    c) Full-screen "CHECKMATE" overlay (GSAP timeline)
 *    d) Board glow expansion ring
 * 7. Confetti burst (useConfetti) â€” brand colors
 * 8. "Puzzle Solved!" badge with spring pop
 * 9. Notation panel with slide-in entries
 * 10. All animations: transforms + opacity only â†’ 60fps
 *
 * â”€â”€ Architecture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * - Data-driven: swap PUZZLE const to change puzzle
 * - State machine: idle â†’ white_moved â†’ black_responding â†’ awaiting_mate â†’ solved | failed | solving
 * - Celebration guard: hasCelebratedRef prevents double-fire
 * - Mobile-safe: cursor effects skip on touch devices
 * - Reduced-motion: all imperative animations check prefersReducedMotion()
 */
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { ThemedChessboard } from "./ThemedChessboard";
import { Chess } from "chess.js";
import { parseUciMove } from "../utils/chessHelpers";
import { useStockfish } from "../hooks/useStockfish";
import { RotateCcw, Play, SkipForward, Zap, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { useConfetti } from "../hooks/useConfetti";
import { useMoveTrail } from "../hooks/useMoveTrail";
import { gsap } from "../utils/gsapConfig";
import { prefersReducedMotion } from "../utils/gsapConfig";
import { useMoveAnnotation } from "../hooks/useMoveAnnotation";
import { MoveAnnotation } from "./MoveAnnotation";
import ChessAnimationLayer from "./ChessAnimationLayer";
import { motion } from "framer-motion";
import { SoundManager } from "../utils/SoundManager";
import { BoardCoordinates } from "./BoardCoordinates";
interface ActiveMove {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  fromSq: string;
  toSq: string;
  pieceType: string;
  isCapture: boolean;
  capturedPieceType: string | null;
  targetPieceEl: HTMLElement | null;
}
// ============================================================================
// ORIGINAL HERO PUZZLE CONFIGURATION (MATE IN TWO)
// ============================================================================
const PUZZLE_ORIGINAL = {
  fen: "2kr4/K1pp4/8/8/8/8/7Q/3R4 w - - 0 1",
  label: "White to play and check mate in two",
  totalMoves: 2,
  blackResponse: { from: "c7", to: "d6" },
  matingMove: { from: "d1", to: "c1" },
  kingSquare: "c8",
  solution: [
    {
      from: "h2",
      to: "d6",
      san: "Qd6",
      annotation: "Brilliant! The queen sacrifices herself on d6.",
      animate: true,
    },
    {
      from: "c7",
      to: "d6",
      san: "...cxd6",
      annotation: "Black is forced to capture.",
      animate: true,
    },
    {
      from: "d1",
      to: "c1",
      san: "Rc1#",
      annotation: "Checkmate! The rook delivers the final blow.",
      animate: true,
    },
  ],
} as const;
type PuzzlePhaseOriginal =
  | "idle"
  | "white_moved"
  | "black_responding"
  | "awaiting_mate"
  | "solved"
  | "failed"
  | "solving";
// ============================================================================
// NEW HERO PUZZLE IMPLEMENTATION (EVERGREEN GAME AUTOPLAY & PUZZLE)
// ============================================================================
// â”€â”€ Timing Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Adjust these values to configure the chessboard animation speed and pauses.
// Values are defined in milliseconds (ms) for readability and ease of tweaking.
const TIMING = {
  MOVE_DURATION: 250, // Duration of the piece glide animation in milliseconds (default: 220ms)
  NORMAL_MOVE_DELAY: 500, // Delay/pause after a normal move finishes in milliseconds (default: 300ms)
  CAPTURE_DELAY: 750, // Delay/pause after a capture move finishes in milliseconds (default: 550ms)
  CHECK_DELAY: 750, // Delay/pause after a checking move finishes in milliseconds (default: 400ms)
  PUZZLE_START_DELAY: 500, // Pause at the stop position before transitioning to puzzle mode in milliseconds (default: 1500ms)
  REPLAY_DELAY: 100, // Pause/delay before replay autoplay loop begins in milliseconds (default: 100ms)
};
// â”€â”€ Board theme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Board colors + piece set now come from Settings -> Board & Pieces
// (see useBoardSettings below) instead of being hardcoded here.
const PGN_MOVES = [
  "e4",
  "e5",
  "Nf3",
  "Nc6",
  "Bc4",
  "Bc5",
  "b4",
  "Bxb4",
  "c3",
  "Ba5",
  "d4",
  "exd4",
  "O-O",
  "d3",
  "Qb3",
  "Qf6",
  "e5",
  "Qg6",
  "Re1",
  "Nge7",
  "Ba3",
  "b5",
  "Qxb5",
  "Rb8",
  "Qa4",
  "Bb6",
  "Nbd2",
  "Bb7",
  "Ne4",
  "Qf5",
  "Bxd3",
  "Qh5",
  "Nf6+",
  "gxf6",
  "exf6",
  "Rg8",
  "Rad1",
  "Qxf3",
  "Rxe7+",
  "Nxe7",
];
const PUZZLE_MOVES = ["Qxd7+", "Kxd7", "Bf5+", "Ke8", "Bd7+", "Kf8", "Bxe7#"];
const ALL_MOVES = [...PGN_MOVES, ...PUZZLE_MOVES];
interface ProcessedMove {
  san: string;
  from: string;
  to: string;
  isCapture: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  kingSquare: string | null;
  fenAfter: string;
}
// Preprocess game steps at compile/load time
function processGameMoves(): ProcessedMove[] {
  const g = new Chess();
  const processed: ProcessedMove[] = [];
  for (const m of ALL_MOVES) {
    const result = g.move(m);
    if (!result) {
      throw new Error(`Invalid move in sequence: ${m}`);
    }
    const isCheck = g.inCheck();
    const isCheckmate = g.isCheckmate();
    let kingSquare: string | null = null;
    if (isCheck || isCheckmate) {
      const checkedColor = g.turn(); // The side currently in check
      const board = g.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.type === "k" && piece.color === checkedColor) {
            kingSquare = piece.square;
            break;
          }
        }
        if (kingSquare) break;
      }
    }
    processed.push({
      san: m,
      from: result.from,
      to: result.to,
      isCapture: !!result.captured,
      isCheck,
      isCheckmate,
      kingSquare,
      fenAfter: g.fen(),
    });
  }
  return processed;
}
const PROCESSED_MOVES = processGameMoves();

const historicalWhiteMoves = [
  PROCESSED_MOVES[40],
  PROCESSED_MOVES[42],
  PROCESSED_MOVES[44],
  PROCESSED_MOVES[46],
];

const historicalBlackMoves = [
  PROCESSED_MOVES[41],
  PROCESSED_MOVES[43],
  PROCESSED_MOVES[45],
];

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const PUZZLE3_FEN = "7k/5p1P/5ppK/6P1/8/8/1q6/BQ6 w - - 4 1";


const getKingSquares = (fen: string) => {
  const tempGame = new Chess(fen);
  let losingKingSq: string | null = null;
  let winningKingSq: string | null = null;
  if (tempGame.isCheckmate()) {
    const losingColor = tempGame.turn();
    const winningColor = losingColor === "w" ? "b" : "w";
    const board = tempGame.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === "k") {
          if (piece.color === losingColor) {
            losingKingSq = piece.square;
          } else if (piece.color === winningColor) {
            winningKingSq = piece.square;
          }
        }
      }
    }
  }
  return { losingKingSq, winningKingSq };
};
interface HeroPuzzleProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function HeroPuzzle({ onDragStart, onDragEnd }: HeroPuzzleProps) {

  const soundManagerRef = useRef<SoundManager>(SoundManager.createInstance());
  const soundManager = soundManagerRef.current;
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const { getEngineMove } = useStockfish();
  const { fireConfetti } = useConfetti();
  const { showTrail, clearTrail } = useMoveTrail();
  const { activeAnnotation, triggerAnnotation, clearAnnotation } =
    useMoveAnnotation();
  // â”€â”€ Chessboard refs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const boardCardRef = useRef<HTMLDivElement>(null);
  const boardInnerRef = useRef<HTMLDivElement>(null);
  const checkmateRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHeroVisibleRef = useRef(true);

const heroSoundRef = useRef({
  playMove: () => {
    if (isHeroVisibleRef.current) soundManager.playMove();
  },
  playCapture: () => {
    if (isHeroVisibleRef.current) soundManager.playCapture();
  },
  playCheck: () => {
    if (isHeroVisibleRef.current) soundManager.playCheck();
  },
  playCheckmate: () => {
    if (isHeroVisibleRef.current) soundManager.playCheckmate();
  },
  playApplause: () => {
    if (isHeroVisibleRef.current) soundManager.playApplause();
  },

  playLose: () => { 
    if (isHeroVisibleRef.current) soundManager.playLose(); 

  },
  playGameEnd: () => {
    if (isHeroVisibleRef.current) soundManager.playGameEnd();
  },
});

  // â”€â”€ State variables for Puzzle 0 (Evergreen Game Autoplay & Puzzle) â”€â”€â”€â”€â”€â”€â”€â”€
  const [phase0, setPhase0] = useState<
    "AUTOPLAY" | "PUZZLE" | "SUCCESS" | "REPLAY"
  >("AUTOPLAY");
  const [gameFen0, setGameFen0] = useState<string>(START_FEN);
  const [currentMoveIndex0, setCurrentMoveIndex0] = useState<number>(-1);
  const currentMoveIndex0Ref = useRef<number>(-1);
  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  useEffect(() => {
    currentMoveIndex0Ref.current = currentMoveIndex0;
  }, [currentMoveIndex0]);

  // Preload piece assets for smooth animations
  useEffect(() => {
    const assets = [
      "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
      "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
      "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
      "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
      "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
      "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
      "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
      "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
      "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
      "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
      "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
    ];
    assets.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);
  const [, setPuzzleStep0] = useState<number>(0);
  const [lastMove0, setLastMove0] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [checkedKingSquare0, setCheckedKingSquare0] = useState<string | null>(
    null,
  );
  const [, setIsCheckmateGlow0] = useState<boolean>(false);
  const [isStockfishThinking0, setIsStockfishThinking0] =
    useState<boolean>(false);
  const [playMode0, setPlayMode0] = useState<"SCRIPTED" | "STOCKFISH">(
    "SCRIPTED",
  );
  const [puzzleMoveIndex0, setPuzzleMoveIndex0] = useState<number>(0);
  const gameRef0 = useRef<Chess>(new Chess(START_FEN));

  // â”€â”€ Carousel index & animation state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [interactiveIndex, setInteractiveIndex] = useState<number | null>(0);
  // â”€â”€ State variables for Puzzle 1 (Mate in Two) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const gameRef1 = useRef<Chess>(new Chess(PUZZLE_ORIGINAL.fen));
  const [gameFen1, setGameFen1] = useState<string>(PUZZLE_ORIGINAL.fen);
  const [phase1, setPhase1] = useState<PuzzlePhaseOriginal>("idle");

  const [solveAnnotationOriginal, setSolveAnnotationOriginal] =
    useState<string>("");
  const [lastMove1, setLastMove1] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [checkedKingSquare1, setCheckedKingSquare1] = useState<string | null>(
    null,
  );
  const [, setIsCheckmateGlow1] = useState<boolean>(false);

  const hasCelebratedOriginalRef = useRef<boolean>(false);
  // â”€â”€ State variables for Puzzle 2 (New Stockfish Puzzle) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const gameRef2 = useRef<Chess>(
    new Chess("r5k1/6pp/r7/q3N1P1/3Q4/1Pp5/2P5/1K1R3R w - - 0 1"),
  );
  const [gameFen2, setGameFen2] = useState<string>(
    "r5k1/6pp/r7/q3N1P1/3Q4/1Pp5/2P5/1K1R3R w - - 0 1",
  );
  const [phase2, setPhase2] = useState<
    "idle" | "black_responding" | "awaiting_move" | "solved" | "failed"
  >("idle");
  const [lastMove2, setLastMove2] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [checkedKingSquare2, setCheckedKingSquare2] = useState<string | null>(
    null,
  );

  const hasCelebrated2Ref = useRef<boolean>(false);
  const solveAbortRef = useRef<boolean>(false);
  const solveTimerRef = useRef<number | null>(null);
  // â”€â”€ State variables for Puzzle 3 (Winning Move â€” Stockfish, new FEN) â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const gameRef3 = useRef<Chess>(new Chess(PUZZLE3_FEN));
  const [gameFen3, setGameFen3] = useState<string>(PUZZLE3_FEN);
  const [phase3, setPhase3] = useState<
    "idle" | "black_responding" | "awaiting_move" | "solved" | "failed"
  >("idle");
  const [lastMove3, setLastMove3] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [checkedKingSquare3, setCheckedKingSquare3] = useState<string | null>(
    null,
  );
  const [, setIsCheckmateGlow3] = useState<boolean>(false);

  const hasCelebrated3Ref = useRef<boolean>(false);
  // â”€â”€ Safe Timers Ref â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const activeTimeoutsRef = useRef<number[]>([]);
  const pendingResolversRef = useRef<(() => void)[]>([]);
  const safeSetTimeout = useCallback((cb: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      activeTimeoutsRef.current = activeTimeoutsRef.current.filter(
        (tId) => tId !== id,
      );
      cb();
    }, delay);
    activeTimeoutsRef.current.push(id);
    return id;
  }, []);
  const clearAllTimeouts = useCallback(() => {
    activeTimeoutsRef.current.forEach((id) => clearTimeout(id));
    activeTimeoutsRef.current = [];
    pendingResolversRef.current.forEach((resolve) => resolve());
    pendingResolversRef.current = [];
  }, []);
  const safeDelay = useCallback(
    (ms: number) => {
      return new Promise<void>((resolve) => {
        let resolved = false;
        const r = () => {
          if (resolved) return;
          resolved = true;
          pendingResolversRef.current = pendingResolversRef.current.filter(
            (x) => x !== r,
          );
          resolve();
        };
        pendingResolversRef.current.push(r);
        safeSetTimeout(r, ms);
      });
    },
    [safeSetTimeout],
  );
  const runCheckmateImpact = useCallback(
    (_kingSq: string | null): Promise<void> => {
      return new Promise((resolve) => {
        if (prefersReducedMotion()) {
          resolve();
          return;
        }
        const board = boardInnerRef.current;
        const card = boardCardRef.current;
        const overlay = checkmateRef.current;
        if (!board || !card || !overlay) {
          resolve();
          return;
        }
        const tl = gsap.timeline({ onComplete: resolve });
        // a) Flash: board briefly goes bright white then snaps back
        tl.to(board, {
          filter: "brightness(3)",
          duration: 0.08,
          ease: "none",
        }).to(board, {
          filter: "brightness(1)",
          duration: 0.25,
          ease: "power2.out",
        });

        // c) CHECKMATE text overlay â€” scale in from 0
        tl.set(overlay, { display: "flex", opacity: 0, scale: 0.6 }).to(
          overlay,
          {
            opacity: 1,
            scale: 1,
            duration: 0.45,
            ease: "back.out(1.7)",
          },
          "+=0.1",
        );
        // d) Glow expansion ring around board card
        // tl.fromTo(
        //   card,
        //   { boxShadow: "0 0 0px 0px rgba(99,102,241,0)" },
        //   {
        //     boxShadow: "0 0 80px 24px rgba(99,102,241,0.6)",
        //     duration: 0.5,
        //     ease: "power2.out",
        //     yoyo: true,
        //     repeat: 2,
        //     onComplete: () => {
        //       gsap.to(card, {
        //         boxShadow: "0 0 30px 8px rgba(99,102,241,0.25)",
        //         duration: 0.8,
        //       });
        //     },
        //   },
        //   "<",
        // );
      });
    },
    [safeSetTimeout],
  );
  // â”€â”€ Overlay Animation State & Hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [activeMove, setActiveMove] = useState<ActiveMove | null>(null);
  const [squareSize, setSquareSize] = useState<number>(50);
  const animResolveRef = useRef<(() => void) | null>(null);
  const animLandRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const updateSize = () => {
      if (boardInnerRef.current) {
        setSquareSize(boardInnerRef.current.getBoundingClientRect().width / 8);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);


  const abortRef = useRef<boolean>(false);
  const autoplayInstanceRef = useRef<number>(0);
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // BOARD ENTRANCE ANIMATION
  // Runs once on mount.
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !boardCardRef.current) return;
    gsap.fromTo(
      boardCardRef.current,
      { opacity: 0, y: 18, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.6,
      },
    );
  }, []);


  useEffect(() => {
  const el = containerRef.current;
  if (!el) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      isHeroVisibleRef.current = entry.isIntersecting;
    },
    {
      threshold: 0.1,
    }
  );

  observer.observe(el);

  return () => observer.disconnect();
}, []);
  // Magnetic piece hover effect removed to allow standard react-chessboard drag without interference
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PREMIUM PIECE ANIMATION SYSTEM
  // Smooth Bezier glide with specialized capture animation fade-out & slams.
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const animatePieceMove = useCallback(
    (
      fromSq: string,
      toSq: string,
      boardEl: HTMLDivElement | null,
      isCapture: boolean,
      updateBoardState: () => void,
    ): Promise<void> => {
      return new Promise((resolve) => {
        if (prefersReducedMotion() || !boardEl) {
          updateBoardState();
          resolve();
          return;
        }
        const getSquareCenter = (sq: string) => {
          const el = boardEl.querySelector(
            `[data-square="${sq}"]`,
          ) as HTMLElement | null;
          if (!el) return null;
          const br = boardEl.getBoundingClientRect();
          const sr = el.getBoundingClientRect();
          return {
            x: sr.left + sr.width / 2 - br.left,
            y: sr.top + sr.height / 2 - br.top,
          };
        };
        const from = getSquareCenter(fromSq);
        const to = getSquareCenter(toSq);
        const pieceEl = boardEl.querySelector(
          `[data-square="${fromSq}"] [data-piece]`,
        ) as HTMLElement | null;
        if (!pieceEl || !from || !to) {
          updateBoardState();
          resolve();
          return;
        }
        // Determine piece color and type for overlay styling
        const pieceType = pieceEl.getAttribute("data-piece") || "wP";
        // Store callbacks so they can be called on land/complete
        animLandRef.current = () => {
          updateBoardState();
        };
        animResolveRef.current = () => {
          resolve();
        };
        // Calculate starting and target positions relative to the overlay div
        const sqW = boardEl.getBoundingClientRect().width / 8;
        const startX = from.x - sqW / 2;
        const startY = from.y - sqW / 2;
        const targetX = to.x - sqW / 2;
        const targetY = to.y - sqW / 2;
        // Captured piece lookup
        const targetPieceEl = boardEl.querySelector(
          `[data-square="${toSq}"] [data-piece]`,
        ) as HTMLElement | null;
        const capturedPieceType = targetPieceEl
          ? targetPieceEl.getAttribute("data-piece")
          : null;
        setActiveMove({
          startX,
          startY,
          targetX,
          targetY,
          fromSq,
          toSq,
          pieceType,
          isCapture,
          capturedPieceType,
          targetPieceEl,
        });
      });
    },
    [],
  );
  const handleAnimationLand = useCallback(() => {
    if (animLandRef.current) {
      animLandRef.current();
      animLandRef.current = null;
    }
  }, []);
  const handleAnimationComplete = useCallback(() => {
    setActiveMove(null);
    if (animResolveRef.current) {
      animResolveRef.current();
      animResolveRef.current = null;
    }
  }, []);
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // MOVE PLAYER AND TIMING COORDINATION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const playStep0 = useCallback(
    async (moveIndex: number, instanceId: number): Promise<void> => {
      const move = PROCESSED_MOVES[moveIndex];
      if (!move) return;
      if (instanceId !== autoplayInstanceRef.current || abortRef.current)
        return;
      setLastMove0({ from: move.from, to: move.to });
      await animatePieceMove(
        move.from,
        move.to,
        boardInnerRef.current,
        move.isCapture,
        () => {
          gameRef0.current.move({
            from: move.from,
            to: move.to,
            promotion: "q",
          });
          setGameFen0(gameRef0.current.fen());
          showTrail(move.from, move.to);
        },
      );
      if (instanceId !== autoplayInstanceRef.current || abortRef.current)
        return;
      // Play appropriate sound after the move
      if (move.isCheckmate) {
        heroSoundRef.current.playCheckmate();
      } else if (move.isCheck) {
        heroSoundRef.current.playCheck();
      } else if (move.isCapture) {
        heroSoundRef.current.playCapture();
      } else {
        heroSoundRef.current.playMove();
      }
      // Pulse checked king's square if checked
      if (move.isCheck || move.isCheckmate) {
        setCheckedKingSquare0(move.kingSquare);
        await safeDelay(450);
        setCheckedKingSquare0(null);
      }
    },
    [animatePieceMove, showTrail, safeDelay],
  );
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // AUTOPLAY TIMELINE LOOP
  // Plays moves 1-20 (Indices 0 to 39), then enters puzzle mode.
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const runAutoplay0 = useCallback(
    async (startIndex: number) => {
      abortRef.current = false;
      const instanceId = ++autoplayInstanceRef.current;
      if (startIndex === 0) {
        gameRef0.current = new Chess(START_FEN);
      } else {
        gameRef0.current = new Chess(PROCESSED_MOVES[startIndex - 1].fenAfter);
      }
      for (let i = startIndex; i < 40; i++) {
        if (abortRef.current || instanceId !== autoplayInstanceRef.current)
          return;
        setCurrentMoveIndex0(i);
        await playStep0(i, instanceId);
        if (abortRef.current || instanceId !== autoplayInstanceRef.current)
          return;
        // Determine pause after the move based on move attributes
        const move = PROCESSED_MOVES[i];
        let pauseTime = TIMING.NORMAL_MOVE_DELAY;
        if (move.isCheck) {
          pauseTime = TIMING.CHECK_DELAY; // Pause after check pulse
        } else if (move.isCapture) {
          pauseTime = TIMING.CAPTURE_DELAY; // Pause after capture animation
        }
        await safeDelay(pauseTime);
      }
      if (abortRef.current || instanceId !== autoplayInstanceRef.current)
        return;
      // Final pause before transition to puzzle (user-configurable)
      await safeDelay(TIMING.PUZZLE_START_DELAY);
      if (abortRef.current || instanceId !== autoplayInstanceRef.current)
        return;
      setPhase0("PUZZLE");
      setCurrentMoveIndex0(40);
      setPuzzleStep0(0);
    },
    [playStep0, safeDelay],
  );

  const handleSkip0 = useCallback(() => {
    abortRef.current = true;
    autoplayInstanceRef.current++;
    clearAllTimeouts();

    if (animResolveRef.current) {
      animResolveRef.current();
      animResolveRef.current = null;
    }
    animLandRef.current = null;
    setActiveMove(null);

    if (checkmateRef.current) {
      gsap.killTweensOf(checkmateRef.current);
      gsap.set(checkmateRef.current, {
        display: "none",
        opacity: 0,
        scale: 0.6,
      });
    }
    if (boardInnerRef.current) {
      gsap.killTweensOf(boardInnerRef.current);
      gsap.set(boardInnerRef.current, { filter: "brightness(1)" });
      boardInnerRef.current.querySelectorAll(".gsap-moving").forEach((el) => {
        if (el !== boardInnerRef.current) el.remove();
      });
    }
    if (boardCardRef.current) {
      gsap.killTweensOf(boardCardRef.current);
      boardCardRef.current.style.boxShadow = "";
    }

    clearTrail();
    clearAnnotation();
    setCheckedKingSquare0(null);

    gameRef0.current = new Chess(PROCESSED_MOVES[39].fenAfter);
    setGameFen0(gameRef0.current.fen());
    setLastMove0({
      from: PROCESSED_MOVES[39].from,
      to: PROCESSED_MOVES[39].to,
    });
    showTrail(PROCESSED_MOVES[39].from, PROCESSED_MOVES[39].to);

    setPhase0("PUZZLE");
    setCurrentMoveIndex0(40);
    setPuzzleStep0(0);
    setIsStockfishThinking0(false);
    setPlayMode0("SCRIPTED");
    setPuzzleMoveIndex0(0);

    abortRef.current = false;
  }, [showTrail, clearAllTimeouts, clearTrail, clearAnnotation]);
  // â”€â”€â”€ Unified Cleanup and Initialization â”€â”€â”€
  const cleanupGame = useCallback(() => {
    abortRef.current = true;
    solveAbortRef.current = true;
    clearAllTimeouts();
    if (solveTimerRef.current) {
      clearTimeout(solveTimerRef.current);
      solveTimerRef.current = null;
    }
    if (checkmateRef.current) {
      gsap.killTweensOf(checkmateRef.current);
      gsap.set(checkmateRef.current, {
        display: "none",
        opacity: 0,
        scale: 0.6,
      });
    }

    if (boardInnerRef.current) {
      boardInnerRef.current.querySelectorAll(".gsap-moving").forEach((el) => {
        if (el !== boardInnerRef.current) el.remove();
      });
    }
    if (boardCardRef.current) {
      boardCardRef.current.style.boxShadow = "";
    }
    clearTrail();
    clearAnnotation();
    setActiveMove(null);
    setIsStockfishThinking0(false);
    setPlayMode0("SCRIPTED");
    setPuzzleMoveIndex0(0);
    gameRef0.current = new Chess(START_FEN);
  }, [clearTrail, clearAnnotation, clearAllTimeouts]);
  const initGame = useCallback(
    (index: number, autoStart = true) => {
      abortRef.current = false;
      solveAbortRef.current = false;
      // Reset visual annotations/markers for a fresh game start
      if (index === 0) {
        setLastMove0(null);
        setCheckedKingSquare0(null);
        setIsCheckmateGlow0(false);
        gameRef0.current = new Chess(START_FEN);
        setGameFen0(START_FEN);
        setPhase0("AUTOPLAY");
        setCurrentMoveIndex0(-1);
        setPuzzleStep0(0);
        setIsStockfishThinking0(false);
        setPlayMode0("SCRIPTED");
        setPuzzleMoveIndex0(0);

        if (autoStart) {
          runAutoplay0(0);
        }
      } else if (index === 1) {
        setLastMove1(null);
        setCheckedKingSquare1(null);
        setIsCheckmateGlow1(false);
        gameRef1.current = new Chess(PUZZLE_ORIGINAL.fen);
        setGameFen1(PUZZLE_ORIGINAL.fen);
        setPhase1("idle");
        setSolveAnnotationOriginal("");
        hasCelebratedOriginalRef.current = false;
      } else if (index === 2) {
        setLastMove2(null);
        setCheckedKingSquare2(null);
        gameRef2.current = new Chess(
          "r5k1/6pp/r7/q3N1P1/3Q4/1Pp5/2P5/1K1R3R w - - 0 1",
        );
        setGameFen2("r5k1/6pp/r7/q3N1P1/3Q4/1Pp5/2P5/1K1R3R w - - 0 1");
        setPhase2("idle");
        hasCelebrated2Ref.current = false;
      } else if (index === 3) {
        setLastMove3(null);
        setCheckedKingSquare3(null);
        setIsCheckmateGlow3(false);
        gameRef3.current = new Chess(PUZZLE3_FEN);
        setGameFen3(PUZZLE3_FEN);
        setPhase3("idle");
        hasCelebrated3Ref.current = false;
      }
    },
    [runAutoplay0],
  );
  // Synchronize board reset & initialization with active index changes
  const prevIndexRef = useRef(activeIndex);
  useEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      // Slide changed!
      prevIndexRef.current = activeIndex;
      setInteractiveIndex(null);
      cleanupGame();
      initGame(activeIndex, false);
    } else {
      // First mount or StrictMode remount
      initGame(0);
      initGame(1);
      initGame(2);
      initGame(3);
    }
    return () => {
      cleanupGame();
    };
  }, [activeIndex, initGame]);
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // MATE-IN-TWO PUZZLE LOGIC & ANCILLARY PROCEDURES (RESTORED & ADAPTED)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const applyMoveOriginal = useCallback(
    (from: string, to: string, promotion = "q"): boolean => {
      try {
        const result = gameRef1.current.move({ from, to, promotion });
        if (!result) return false;
        setGameFen1(gameRef1.current.fen());
        setLastMove1({ from, to });
        showTrail(from, to);
        return true;
      } catch {
        return false;
      }
    },
    [showTrail],
  );
  const pickSafeBlackMoveOriginal = useCallback((): string | null => {
    const game = gameRef1.current;
    const legalMoves = game.moves();
    if (legalMoves.length === 0) return null;
    const safeMoves = legalMoves.filter((move) => {
      const probe = new Chess(game.fen());
      probe.move(move);
      const whiteReplies = probe.moves();
      return whiteReplies.some((wr) => {
        const probe2 = new Chess(probe.fen());
        probe2.move(wr);
        return probe2.isCheckmate();
      });
    });
    const pool = safeMoves.length > 0 ? safeMoves : legalMoves;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);
  const celebrateOriginal = useCallback(async () => {
    if (hasCelebratedOriginalRef.current) return;
    hasCelebratedOriginalRef.current = true;
    const checkmateFen = gameRef1.current.fen();
    const tempGame = new Chess(checkmateFen);
    const losingColor = tempGame.turn(); // the side that is in checkmate
    const playerWon = losingColor === "b"; 
    const { losingKingSq } = getKingSquares(checkmateFen);

    if (playerWon) {
      setPhase1("solved");
    } else {
      setPhase1("failed");
    }
    setIsCheckmateGlow1(true);

    heroSoundRef.current.playCheckmate();
    await runCheckmateImpact(losingKingSq);
    await safeDelay(900);
    if (solveAbortRef.current) return;

    if (playerWon) {
      // AI checkmated — celebrate!
      heroSoundRef.current.playApplause();
      fireConfetti();
    } else {
      // Player checkmated — subtle lose sfx, no confetti
      heroSoundRef.current.playLose();
    }

    if (checkmateRef.current) {
      gsap.to(checkmateRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        onComplete: () => {
          if (checkmateRef.current) {
            checkmateRef.current.style.display = "none";
          }
        },
      });
    }
  }, [fireConfetti, runCheckmateImpact, safeDelay]);
  const onDrop1 = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (phase1 !== "idle" && phase1 !== "awaiting_mate") return false;
      if (gameRef1.current.turn() !== "w") return false;
      const moves = gameRef1.current.moves({ verbose: true });
      const targetMove = moves.find(
        (m) => m.from === sourceSquare && m.to === targetSquare,
      );
      if (!targetMove) return false;
      const isCapture = !!targetMove.captured;
      animatePieceMove(
        sourceSquare,
        targetSquare,
        boardInnerRef.current,
        isCapture,
        () => {
          applyMoveOriginal(sourceSquare, targetSquare);
        },
      ).then(() => {
        if (solveAbortRef.current) return;
        const game = gameRef1.current;
        // Play sound based on move result
        if (game.isCheckmate()) {
          heroSoundRef.current.playCheckmate();
        } else if (game.inCheck()) {
          heroSoundRef.current.playCheck();
        } else if (isCapture) {
          heroSoundRef.current.playCapture();
        } else {
          heroSoundRef.current.playMove();
        }
        // const history = game.history({ verbose: true });
        // const lastEntry = history[history.length - 1];
        // const displaySan = lastEntry.san.replace('x', '');
        if (phase1 === "idle") {
          if (game.isCheckmate()) {
            triggerAnnotation(targetSquare, "!!");
            celebrateOriginal();
            return;
          }
          setPhase1("black_responding");
          triggerAnnotation(targetSquare, "!!");
          safeSetTimeout(() => {
            if (solveAbortRef.current) return;
            const blackMove = pickSafeBlackMoveOriginal();
            if (blackMove) {
              const probe = new Chess(game.fen());
              const moveResult = probe.move(blackMove);
              if (moveResult) {
                animatePieceMove(
                  moveResult.from,
                  moveResult.to,
                  boardInnerRef.current,
                  !!moveResult.captured,
                  () => {
                    gameRef1.current.move(blackMove);
                    setGameFen1(gameRef1.current.fen());
                    setLastMove1({ from: moveResult.from, to: moveResult.to });
                    showTrail(moveResult.from, moveResult.to);
                  },
                ).then(() => {
                  // Black's response sound
                  if (!!moveResult.captured) {
                    heroSoundRef.current.playCapture();
                  } else {
                    heroSoundRef.current.playMove();
                  }
                  setPhase1("awaiting_mate");
                });
              } else {
                setPhase1("awaiting_mate");
              }
            } else {
              setPhase1("awaiting_mate");
            }
          }, 600);
        } else if (phase1 === "awaiting_mate") {
          if (game.isCheckmate()) {
            celebrateOriginal();
          } else {
            setPhase1("black_responding");
            safeSetTimeout(() => {
              if (solveAbortRef.current) return;
              const blackMove = pickSafeBlackMoveOriginal();
              if (blackMove) {
                const probe = new Chess(game.fen());
                const moveResult = probe.move(blackMove);
                if (moveResult) {
                  animatePieceMove(
                    moveResult.from,
                    moveResult.to,
                    boardInnerRef.current,
                    !!moveResult.captured,
                    () => {
                      gameRef1.current.move(blackMove);
                      setGameFen1(gameRef1.current.fen());
                      setLastMove1({
                        from: moveResult.from,
                        to: moveResult.to,
                      });
                      showTrail(moveResult.from, moveResult.to);
                    },
                  ).then(() => {
                    // Black's response sound
                    if (!!moveResult.captured) {
                      heroSoundRef.current.playCapture();
                    } else {
                      heroSoundRef.current.playMove();
                    }
                    setPhase1("awaiting_mate");
                  });
                } else {
                  setPhase1("awaiting_mate");
                }
              } else {
                setPhase1("awaiting_mate");
              }
            }, 600);
          }
        }
      });
      return true;
    },
    [
      phase1,
      applyMoveOriginal,
      celebrateOriginal,
      triggerAnnotation,
      pickSafeBlackMoveOriginal,
      animatePieceMove,
      showTrail,
      safeSetTimeout,
    ],
  );
  const handleSolve1 = useCallback(async () => {
    cleanupGame();
    solveAbortRef.current = false;
    setPhase1("solving");
    const step1 = PUZZLE_ORIGINAL.solution[0];
    await safeDelay(500);
    if (solveAbortRef.current) return;
    setSolveAnnotationOriginal(step1.annotation);
    await animatePieceMove(
      step1.from,
      step1.to,
      boardInnerRef.current,
      false,
      () => {
        applyMoveOriginal(step1.from, step1.to);
      },
    );
    if (solveAbortRef.current) return;
    heroSoundRef.current.playMove();
    triggerAnnotation(step1.to, "!!");
    await safeDelay(900);
    if (solveAbortRef.current) return;
    const step2 = PUZZLE_ORIGINAL.solution[1];
    setSolveAnnotationOriginal(step2.annotation);
    await animatePieceMove(
      step2.from,
      step2.to,
      boardInnerRef.current,
      true,
      () => {
        applyMoveOriginal(step2.from, step2.to);
      },
    );
    if (solveAbortRef.current) return;
    heroSoundRef.current.playCapture();
    await safeDelay(900);
    if (solveAbortRef.current) return;
    const step3 = PUZZLE_ORIGINAL.solution[2];
    setSolveAnnotationOriginal(step3.annotation);
    await animatePieceMove(
      step3.from,
      step3.to,
      boardInnerRef.current,
      false,
      () => {
        applyMoveOriginal(step3.from, step3.to);
      },
    );
    if (solveAbortRef.current) return;
    await safeDelay(650);
    if (!solveAbortRef.current) {
      celebrateOriginal();
    }
  }, [
    cleanupGame,
    animatePieceMove,
    applyMoveOriginal,
    triggerAnnotation,
    celebrateOriginal,
    safeDelay,
  ]);
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // CHECKMATE POPUP CELEBRATION (RESTORED PREVIOUS BEHAVIOUR)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const celebrate0 = useCallback(
    async (kingSq: string | null) => {
      // Determine who was mated by inspecting the current game position
      const checkmateFen = gameRef0.current.fen();
      const tempGame0 = new Chess(checkmateFen);
      // tempGame0.turn() is the side that cannot move (the losing side)
      const playerWon0 = tempGame0.turn() === "b"; // white (player) wins when black is mated

      setPhase0("SUCCESS");
      setIsCheckmateGlow0(true);
      heroSoundRef.current.playCheckmate();
      // Show CHECKMATE popup
      await runCheckmateImpact(kingSq);
      // Hold the checkmate text for a brief pause before fading it out
      await safeDelay(900);
      if (abortRef.current) return;
      if (playerWon0) {
        // AI checkmated — celebrate!
        heroSoundRef.current.playApplause();
        fireConfetti();
      } else {
        // Player checkmated — subtle lose sfx, no confetti
        heroSoundRef.current.playLose();
      }
      // Fade checkmate badge overlay out smoothly
      if (checkmateRef.current) {
        gsap.to(checkmateRef.current, {
          opacity: 0,
          scale: 0.8,
          duration: 0.3,
          onComplete: () => {
            if (checkmateRef.current) {
              checkmateRef.current.style.display = "none";
            }
          },
        });
      }
    },
    [fireConfetti, runCheckmateImpact, safeDelay],
  );

  const celebrate2 = useCallback(async () => {
    if (hasCelebrated2Ref.current) return;
    hasCelebrated2Ref.current = true;
    const checkmateFen = gameRef2.current.fen();
    const tempGame = new Chess(checkmateFen);

    if (tempGame.isDraw()) {
      setPhase2("failed");
      return;
    }

    if (!tempGame.isCheckmate()) return;

    const losingColor = tempGame.turn();
    const whiteWon = losingColor === "b";
    const { losingKingSq } = getKingSquares(checkmateFen);

    if (whiteWon) {
      setPhase2("solved");
      heroSoundRef.current.playCheckmate();
      await runCheckmateImpact(losingKingSq);
      await safeDelay(900);
      if (solveAbortRef.current) return;
      heroSoundRef.current.playApplause();
      fireConfetti();
    } else {
      // Black won (White checkmated)
      setPhase2("failed");
      heroSoundRef.current.playLose();
      await runCheckmateImpact(losingKingSq);
      await safeDelay(900);
      if (solveAbortRef.current) return;
    }

    if (checkmateRef.current) {
      gsap.to(checkmateRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        onComplete: () => {
          if (checkmateRef.current) {
            checkmateRef.current.style.display = "none";
          }
        },
      });
    }
  }, [fireConfetti, runCheckmateImpact, safeDelay]);

  // â”€â”€ Celebrate/OnDrop for Puzzle 3 (mirrors Puzzle 2 logic) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const celebrate3 = useCallback(async () => {
    if (hasCelebrated3Ref.current) return;
    hasCelebrated3Ref.current = true;
    const checkmateFen = gameRef3.current.fen();
    const tempGame = new Chess(checkmateFen);

    if (tempGame.isDraw()) {
      setPhase3("failed");
      return;
    }

    if (!tempGame.isCheckmate()) return;

    const losingColor = tempGame.turn();
    const whiteWon = losingColor === "b";
    const { losingKingSq } = getKingSquares(checkmateFen);

    if (whiteWon) {
      setPhase3("solved");
      setIsCheckmateGlow3(true);
      heroSoundRef.current.playCheckmate();
      await runCheckmateImpact(losingKingSq);
      await safeDelay(900);
      if (solveAbortRef.current) return;
      heroSoundRef.current.playApplause();
      fireConfetti();
    } else {
      setPhase3("failed");
      heroSoundRef.current.playLose();
      await runCheckmateImpact(losingKingSq);
      await safeDelay(900);
      if (solveAbortRef.current) return;
    }

    if (checkmateRef.current) {
      gsap.to(checkmateRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        onComplete: () => {
          if (checkmateRef.current) {
            checkmateRef.current.style.display = "none";
          }
        },
      });
    }
  }, [fireConfetti, runCheckmateImpact, safeDelay]);

  const onDrop3 = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (phase3 !== "idle" && phase3 !== "awaiting_move") return false;
      const game = gameRef3.current;
      if (game.turn() !== "w") return false;

      const moves = game.moves({ verbose: true });
      const targetMove = moves.find(
        (m) => m.from === sourceSquare && m.to === targetSquare,
      );
      if (!targetMove) return false;

      const isCapture = !!targetMove.captured;
      animatePieceMove(
        sourceSquare,
        targetSquare,
        boardInnerRef.current,
        isCapture,
        () => {
          game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
          setGameFen3(game.fen());
          setLastMove3({ from: sourceSquare, to: targetSquare });
          showTrail(sourceSquare, targetSquare);
        },
      ).then(() => {
        if (solveAbortRef.current) return;
        // Play sound for user's move
        if (game.isGameOver()) {
          celebrate3();
          return;
        }
        if (game.inCheck()) {
          heroSoundRef.current.playCheck();
        } else if (isCapture) {
          heroSoundRef.current.playCapture();
        } else {
          heroSoundRef.current.playMove();
        }

        setPhase3("black_responding");
        triggerAnnotation(targetSquare, "!!");

        safeSetTimeout(() => {
          if (solveAbortRef.current) return;
          getEngineMove(game.fen(), 5, (bestMoveStr) => {
            if (solveAbortRef.current) return;
            const { from, to, promotion } = parseUciMove(bestMoveStr);
            const legalMoves = game.moves({ verbose: true });
            const engineMove = legalMoves.find(
              (m) => m.from === from && m.to === to,
            );
            if (engineMove) {
              animatePieceMove(
                from,
                to,
                boardInnerRef.current,
                !!engineMove.captured,
                () => {
                  game.move({ from, to, promotion: promotion || "q" });
                  setGameFen3(game.fen());
                  setLastMove3({ from, to });
                  showTrail(from, to);
                },
              ).then(() => {
                // Play sound for engine's response
                if (!!engineMove.captured) {
                  heroSoundRef.current.playCapture();
                } else {
                  heroSoundRef.current.playMove();
                }
                if (game.isGameOver()) {
                  celebrate3();
                } else {
                  setPhase3("awaiting_move");
                }
              });
            } else {
              setPhase3("awaiting_move");
            }
          });
        }, 600);
      });

      return true;
    },
    [
      phase3,
      animatePieceMove,
      getEngineMove,
      showTrail,
      triggerAnnotation,
      safeSetTimeout,
      celebrate3,
    ],
  );

  const onDrop2 = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (phase2 !== "idle" && phase2 !== "awaiting_move") return false;
      const game = gameRef2.current;
      if (game.turn() !== "w") return false;

      const moves = game.moves({ verbose: true });
      const targetMove = moves.find(
        (m) => m.from === sourceSquare && m.to === targetSquare,
      );
      if (!targetMove) return false;

      const isCapture = !!targetMove.captured;
      animatePieceMove(
        sourceSquare,
        targetSquare,
        boardInnerRef.current,
        isCapture,
        () => {
          game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
          setGameFen2(game.fen());
          setLastMove2({ from: sourceSquare, to: targetSquare });
          showTrail(sourceSquare, targetSquare);
        },
      ).then(() => {
        if (solveAbortRef.current) return;
        // Play sound for user's move
        if (game.isGameOver()) {
          celebrate2();
          return;
        }
        if (game.inCheck()) {
          heroSoundRef.current.playCheck();
        } else if (isCapture) {
          heroSoundRef.current.playCapture();
        } else {
          heroSoundRef.current.playMove();
        }

        // Trigger Stockfish response for Black
        setPhase2("black_responding");
        triggerAnnotation(targetSquare, "!!");

        safeSetTimeout(() => {
          if (solveAbortRef.current) return;
          getEngineMove(game.fen(), 5, (bestMoveStr) => {
            if (solveAbortRef.current) return;
            const { from, to, promotion } = parseUciMove(bestMoveStr);
            const legalMoves = game.moves({ verbose: true });
            const engineMove = legalMoves.find(
              (m) => m.from === from && m.to === to,
            );
            if (engineMove) {
              animatePieceMove(
                from,
                to,
                boardInnerRef.current,
                !!engineMove.captured,
                () => {
                  game.move({ from, to, promotion: promotion || "q" });
                  setGameFen2(game.fen());
                  setLastMove2({ from, to });
                  showTrail(from, to);
                },
              ).then(() => {
                // Play sound for engine's response
                if (!!engineMove.captured) {
                  heroSoundRef.current.playCapture();
                } else {
                  heroSoundRef.current.playMove();
                }
                if (game.isGameOver()) {
                  celebrate2();
                } else {
                  setPhase2("awaiting_move");
                }
              });
            } else {
              setPhase2("awaiting_move");
            }
          });
        }, 600);
      });

      return true;
    },
    [
      phase2,
      animatePieceMove,
      getEngineMove,
      showTrail,
      triggerAnnotation,
      safeSetTimeout,
      celebrate2,
    ],
  );
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // INTERACTIVE USER DROP AND SOLUTION VALIDATION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (activeIndex === 3) {
        return onDrop3(sourceSquare, targetSquare);
      }
      if (activeIndex === 2) {
        return onDrop2(sourceSquare, targetSquare);
      }
      if (activeIndex === 1) {
        return onDrop1(sourceSquare, targetSquare);
      }
      if (phase0 !== "PUZZLE") return false;

      const game = gameRef0.current;
      const piece = game.get(sourceSquare as any);
      if (!piece || piece.color !== "w") return false;

      const legalMoves = game.moves({ verbose: true });
      const targetMove = legalMoves.find(
        (m) => m.from === sourceSquare && m.to === targetSquare,
      );
      if (!targetMove) return false;

      const isCapture = !!targetMove.captured;

      if (playMode0 === "SCRIPTED") {
        const expectedWhiteMove = historicalWhiteMoves[puzzleMoveIndex0];
        const expectedBlackMove = historicalBlackMoves[puzzleMoveIndex0];

        if (
          expectedWhiteMove &&
          sourceSquare === expectedWhiteMove.from &&
          targetSquare === expectedWhiteMove.to
        ) {
          // Case 1 â€“ White follows the historical Evergreen Game
          animatePieceMove(
            sourceSquare,
            targetSquare,
            boardInnerRef.current,
            isCapture,
            () => {
              game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: "q",
              });
              setGameFen0(game.fen());
              setLastMove0({ from: sourceSquare, to: targetSquare });
              showTrail(sourceSquare, targetSquare);
              triggerAnnotation(expectedWhiteMove.to, "!!");
            },
          ).then(() => {
            if (abortRef.current) return;

            // Play sound for user's white move
            if (game.isCheckmate()) {
              // celebrate0 will play checkmate sound
            } else if (game.inCheck()) {
              heroSoundRef.current.playCheck();
            } else if (isCapture) {
              heroSoundRef.current.playCapture();
            } else {
              heroSoundRef.current.playMove();
            }

            if (game.isGameOver()) {
              if (game.isCheckmate()) {
                const { losingKingSq } = getKingSquares(game.fen());
                celebrate0(losingKingSq);
              } else {
                setPhase0("SUCCESS");
              }
              return;
            }

            if (expectedBlackMove) {
              safeSetTimeout(async () => {
                if (abortRef.current) return;
                setLastMove0({
                  from: expectedBlackMove.from,
                  to: expectedBlackMove.to,
                });
                await animatePieceMove(
                  expectedBlackMove.from,
                  expectedBlackMove.to,
                  boardInnerRef.current,
                  expectedBlackMove.isCapture,
                  () => {
                    game.move({
                      from: expectedBlackMove.from,
                      to: expectedBlackMove.to,
                      promotion: "q",
                    });
                    setGameFen0(game.fen());
                    showTrail(expectedBlackMove.from, expectedBlackMove.to);
                  },
                );
                if (abortRef.current) return;
                // Play sound for scripted black's move
                if (expectedBlackMove.isCapture) {
                  heroSoundRef.current.playCapture();
                } else {
                  heroSoundRef.current.playMove();
                }
                setPuzzleMoveIndex0((prev) => prev + 1);
                setPuzzleStep0((prev) => prev + 1);

                if (game.isGameOver()) {
                  if (game.isCheckmate()) {
                    const { losingKingSq } = getKingSquares(game.fen());
                    celebrate0(losingKingSq);
                  } else {
                    setPhase0("SUCCESS");
                  }
                }
              }, 600);
            }
          });
          return true;
        } else {
          // Case 2 â€“ White deviates from historical game (switch to STOCKFISH mode permanently)
          setPlayMode0("STOCKFISH");

          animatePieceMove(
            sourceSquare,
            targetSquare,
            boardInnerRef.current,
            isCapture,
            () => {
              game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: "q",
              });
              setGameFen0(game.fen());
              setLastMove0({ from: sourceSquare, to: targetSquare });
              showTrail(sourceSquare, targetSquare);
            },
          ).then(() => {
            if (abortRef.current) return;

            // Play sound for user's deviating white move
            if (game.isCheckmate()) {
              // celebrate0 will play checkmate sound
            } else if (game.inCheck()) {
              heroSoundRef.current.playCheck();
            } else if (isCapture) {
              heroSoundRef.current.playCapture();
            } else {
              heroSoundRef.current.playMove();
            }

            if (game.isGameOver()) {
              if (game.isCheckmate()) {
                const { losingKingSq } = getKingSquares(game.fen());
                celebrate0(losingKingSq);
              } else {
                setPhase0("SUCCESS");
              }
              return;
            }

            setIsStockfishThinking0(true);
            safeSetTimeout(() => {
              if (abortRef.current) return;
              getEngineMove(game.fen(), 5, (bestMoveStr) => {
                if (abortRef.current) return;
                const { from, to, promotion } = parseUciMove(bestMoveStr);
                const engineMoves = game.moves({ verbose: true });
                const engineMove = engineMoves.find(
                  (m) => m.from === from && m.to === to,
                );
                if (engineMove) {
                  animatePieceMove(
                    from,
                    to,
                    boardInnerRef.current,
                    !!engineMove.captured,
                    () => {
                      game.move({ from, to, promotion: promotion || "q" });
                      setGameFen0(game.fen());
                      setLastMove0({ from, to });
                      showTrail(from, to);
                    },
                  ).then(() => {
                    setIsStockfishThinking0(false);
                    // Play sound for engine's response
                    if (!!engineMove.captured) {
                      heroSoundRef.current.playCapture();
                    } else {
                      heroSoundRef.current.playMove();
                    }
                    setPuzzleMoveIndex0((prev) => prev + 1);
                    setPuzzleStep0((prev) => prev + 1);

                    if (game.isGameOver()) {
                      if (game.isCheckmate()) {
                        const { losingKingSq } = getKingSquares(game.fen());
                        celebrate0(losingKingSq);
                      } else {
                        setPhase0("SUCCESS");
                      }
                    }
                  });
                } else {
                  setIsStockfishThinking0(false);
                  setPuzzleMoveIndex0((prev) => prev + 1);
                  setPuzzleStep0((prev) => prev + 1);
                }
              });
            }, 600);
          });
          return true;
        }
      } else {
        // STOCKFISH mode (White has already deviated in a previous turn)
        animatePieceMove(
          sourceSquare,
          targetSquare,
          boardInnerRef.current,
          isCapture,
          () => {
            game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
            setGameFen0(game.fen());
            setLastMove0({ from: sourceSquare, to: targetSquare });
            showTrail(sourceSquare, targetSquare);
          },
        ).then(() => {
          if (abortRef.current) return;

          // Play sound for user's white move (Stockfish mode)
          if (game.isCheckmate()) {
            // celebrate0 will play checkmate sound
          } else if (game.inCheck()) {
            heroSoundRef.current.playCheck();
          } else if (isCapture) {
            heroSoundRef.current.playCapture();
          } else {
            heroSoundRef.current.playMove();
          }

          if (game.isGameOver()) {
            if (game.isCheckmate()) {
              const { losingKingSq } = getKingSquares(game.fen());
              celebrate0(losingKingSq);
            } else {
              setPhase0("SUCCESS");
            }
            return;
          }

          setIsStockfishThinking0(true);
          safeSetTimeout(() => {
            if (abortRef.current) return;
            getEngineMove(game.fen(), 5, (bestMoveStr) => {
              if (abortRef.current) return;
              const { from, to, promotion } = parseUciMove(bestMoveStr);
              const engineMoves = game.moves({ verbose: true });
              const engineMove = engineMoves.find(
                (m) => m.from === from && m.to === to,
              );
              if (engineMove) {
                animatePieceMove(
                  from,
                  to,
                  boardInnerRef.current,
                  !!engineMove.captured,
                  () => {
                    game.move({ from, to, promotion: promotion || "q" });
                    setGameFen0(game.fen());
                    setLastMove0({ from, to });
                    showTrail(from, to);
                  },
                ).then(() => {
                  setIsStockfishThinking0(false);
                  // Play sound for engine's response
                  if (!!engineMove.captured) {
                    heroSoundRef.current.playCapture();
                  } else {
                    heroSoundRef.current.playMove();
                  }
                  setPuzzleMoveIndex0((prev) => prev + 1);
                  setPuzzleStep0((prev) => prev + 1);

                  if (game.isGameOver()) {
                    if (game.isCheckmate()) {
                      const { losingKingSq } = getKingSquares(game.fen());
                      celebrate0(losingKingSq);
                    } else {
                      setPhase0("SUCCESS");
                    }
                  }
                });
              } else {
                setIsStockfishThinking0(false);
                setPuzzleMoveIndex0((prev) => prev + 1);
                setPuzzleStep0((prev) => prev + 1);
              }
            });
          }, 600);
        });
        return true;
      }
    },
    [
      activeIndex,
      phase0,
      playMode0,
      puzzleMoveIndex0,
      showTrail,
      triggerAnnotation,
      animatePieceMove,
      celebrate0,
      onDrop1,
      onDrop2,
      onDrop3,
      safeSetTimeout,
      getEngineMove,
    ],
  );
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // REPLAY TIMELINE RESET AND TRIGGER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const handleReplay0 = useCallback(() => {
    abortRef.current = true;
    autoplayInstanceRef.current++;
    clearAllTimeouts();
    clearTrail();
    clearAnnotation();
    setCheckedKingSquare0(null);
    setIsCheckmateGlow0(false);
    setPuzzleStep0(0);
    setLastMove0(null);
    gameRef0.current = new Chess(START_FEN);
    setGameFen0(START_FEN);
    setActiveMove(null);
    setPhase0("REPLAY");
    setIsStockfishThinking0(false);
    setPlayMode0("SCRIPTED");
    setPuzzleMoveIndex0(0);
    safeSetTimeout(() => {
      abortRef.current = false;
      setPhase0("AUTOPLAY");
      runAutoplay0(0);
    }, TIMING.REPLAY_DELAY);
  }, [
    runAutoplay0,
    clearTrail,
    clearAnnotation,
    clearAllTimeouts,
    safeSetTimeout,
  ]);

  // Compute text labels based on phase and active game
  let descBottom = "Anderssen vs Dufresne, 1852";
  if (activeIndex === 0) {
    if (phase0 === "PUZZLE") {
      descBottom = "White to move.";
    } else if (phase0 === "SUCCESS") {
      descBottom = "Anderssen vs Dufresne, 1852 â€”.";
    } else if (phase0 === "REPLAY") {
      descBottom = "Restarting autoplay...";
    }
  } else if (activeIndex === 1) {
    if (phase1 === "solving") {
      descBottom =
        solveAnnotationOriginal || "White to play and checkmate in two.";
    } else if (phase1 === "solved") {
      descBottom = "Checkmate! The rook delivers the final blow.";
    } else {
      descBottom = "White to play and checkmate in two.";
    }
  } else if (activeIndex === 2) {
    if (phase2 === "solved") {
      descBottom = "Checkmate! The puzzle is solved.";
    } else if (phase2 === "failed") {
      const game = gameRef2.current;
      if (game.isCheckmate()) {
        descBottom = "Checkmate! Black wins.";
      } else if (game.isDraw()) {
        descBottom = "Game drawn.";
      } else {
        descBottom = "Game over.";
      }
    } else {
      descBottom = "Find the winning move for white.";
    }
  } else {
    if (phase3 === "solved") {
      descBottom = "Checkmate! The puzzle is solved.";
    } else if (phase3 === "failed") {
      const game = gameRef3.current;
      if (game.isCheckmate()) {
        descBottom = "Checkmate! Black wins.";
      } else if (game.isDraw()) {
        descBottom = "Game drawn.";
      } else {
        descBottom = "Game over.";
      }
    }
  }
  // â”€â”€ Carousel definitions â”€â”€
  const CAROUSEL_ITEMS = [
    {
      fen: START_FEN,
    },
    {
      fen: PUZZLE_ORIGINAL.fen,
    },
    {
      fen: "r5k1/6pp/r7/q3N1P1/3Q4/1Pp5/2P5/1K1R3R w - - 0 1",
    },
    {
      fen: PUZZLE3_FEN,
    },
  ];
  const toPrev = () => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };
  const toNext = () => {
    setActiveIndex((prev) => Math.min(CAROUSEL_ITEMS.length - 1, prev + 1));
  };
  const toSlide = (index: number) => {
    setActiveIndex(index);
  };
  const handleReplayOriginal = useCallback(() => {
    cleanupGame();
    initGame(1);
  }, [cleanupGame, initGame]);
  return (
    <div ref={containerRef} className="flex flex-col gap-0.5">
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HORIZONTAL CAROUSEL STAGE
          The outer div clips to show only the active board + peeking previews.
          The inner motion.div slides horizontally like a real deck of cards.
          Each "slide" is as wide as the board; active slide = full Hero board,
          inactive slides = rotated mini-board preview cards that peek into view.
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* Stage: clips the visible area so only the active board + partial previews show */}
      <div
        className="relative w-full"
        style={{ overflow: "hidden" }}
      >
        {/* Outer glow for checkmate state */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none z-10"

        />
        {/* CHECKMATE impact overlay â€” GSAP toggles display:flex */}
        <div
          ref={checkmateRef}
          className="absolute inset-0 z-40 items-center justify-center pointer-events-none rounded-xl"
          style={{ display: "none" }}
        >
          <div className="checkmate-overlay-badge">
            <Zap className="w-6 h-6 text-yellow-300 mb-1" />
            <span className="checkmate-text">CHECKMATE</span>
          </div>
        </div>
        {/* Floating background particles */}
        <div
          className="hero-particles absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          {[
            "\u265e",
            "\u265d",
            "\u265c",
            "\u265f",
            "\u265e",
            "\u265d",
            "\u265c",
            "\u265f",
          ].map((symbol, i) => (
            <span key={i} className={`hero-particle hero-particle-${i + 1}`}>
              {symbol}
            </span>
          ))}
        </div>
        {/* Sliding deck â€” translates left/right to bring the active slide into view */}
        <motion.div
          className="flex items-center"
          initial={false}
          animate={{
            x: `calc(-${activeIndex * 100}% - ${activeIndex * 32}px)`,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 32,
            mass: 1.1,
          }}
          onAnimationComplete={() => {
            if (interactiveIndex !== activeIndex) {
              setInteractiveIndex(activeIndex);
              // Resume slide 0 autoplay if it was aborted in AUTOPLAY phase
              if (activeIndex === 0 && phase0 === "AUTOPLAY") {
                const nextIndex =
                  currentMoveIndex0Ref.current === -1
                    ? 0
                    : currentMoveIndex0Ref.current + 1;
                if (nextIndex < 40) {
                  runAutoplay0(nextIndex);
                }
              }
            }
          }}
          style={{ willChange: "transform" }}
        >
          {CAROUSEL_ITEMS.map((_item, i) => {
            const isActive = i === activeIndex;

            const boardFen =
              i === 0
                ? gameFen0
                : i === 1
                  ? gameFen1
                  : i === 2
                    ? gameFen2
                    : gameFen3;
            const boardLastMove =
              i === 0
                ? lastMove0
                : i === 1
                  ? lastMove1
                  : i === 2
                    ? lastMove2
                    : lastMove3;
            const boardCheckedKingSquare =
              i === 0
                ? checkedKingSquare0
                : i === 1
                  ? checkedKingSquare1
                  : i === 2
                    ? checkedKingSquare2
                    : checkedKingSquare3;
            const { losingKingSq, winningKingSq } = getKingSquares(boardFen);
            const boardIsInteractive =
              i === 0
                ? phase0 === "PUZZLE" && !isStockfishThinking0
                : i === 1
                  ? phase1 === "idle" || phase1 === "awaiting_mate"
                  : i === 2
                    ? phase2 === "idle" || phase2 === "awaiting_move"
                    : phase3 === "idle" || phase3 === "awaiting_move";

            // Construct custom square styles for this specific board
            const boardSquareStyles: Record<string, React.CSSProperties> = {};
            if (boardLastMove) {
              boardSquareStyles[boardLastMove.from] = {
                backgroundColor: "rgba(255, 214, 10, 0.35)",
              };
              boardSquareStyles[boardLastMove.to] = {
                backgroundColor: "rgba(255, 214, 10, 0.50)",
              };
            }
            const isCheckmate =
              i === 0
                ? phase0 === "SUCCESS"
                : i === 1
                  ? phase1 === "solved"
                  : i === 2
                    ? phase2 === "solved"
                    : phase3 === "solved";
            if (boardCheckedKingSquare && !isCheckmate) {
              boardSquareStyles[boardCheckedKingSquare] = {
                backgroundColor: "rgba(239, 68, 68, 0.55)",
                boxShadow: "inset 0 0 20px rgba(239, 68, 68, 0.8)",
                animation: "king-pulse 0.4s ease-in-out 3",
              };
            }

            return (
              <div
                key={i}
                className="shrink-0 relative"
                style={{
                  width: "100%",
                  marginRight: i < CAROUSEL_ITEMS.length - 1 ? "32px" : "0",
                }}
              >
                <motion.div
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{
                    type: "tween",
                    ease: "easeInOut",
                    duration: 0.5,
                  }}
                  style={{
                    width: "100%",
                  }}
                >
                  <div
                    ref={isActive ? boardCardRef : null}
                    className="relative rounded-sm overflow-hidden flex flex-col p-0"
                    style={{
                      willChange: "transform, opacity, box-shadow",
                      transition: "box-shadow 1.5s ease-in-out",
                    }}
                  >
                    {/* Chessboard Container */}
                    <div
                      ref={isActive ? boardInnerRef : null}
                      id={`hero-chessboard-${i}`}
                      className="aspect-square overflow-hidden relative w-full"
                      style={{ willChange: "filter" }}
                    >
                      {/* GSAP piece movement overlay (only active on active board) */}
                      {isActive && activeMove && (
                        <ChessAnimationLayer
                          activeMove={activeMove}
                          squareSize={squareSize}
                          onLand={handleAnimationLand}
                          onComplete={handleAnimationComplete}
                        />
                      )}

                      {/* Hide real piece during GSAP move */}
                      {isActive && activeMove && (
                        <style>{`
                          #hero-chessboard-${i} [data-square="${activeMove.fromSq}"] [data-piece] {
                            opacity: 0 !important;
                            pointer-events: none !important;
                          }
                        `}</style>
                      )}

                      {/* The Chessboard - ALWAYS mounted! */}
                      <ThemedChessboard
                        options={{
                          position: boardFen,
                          onPieceDrag: () => {
                            onDragStart?.();
                          },
                          onPieceDrop: ({ sourceSquare, targetSquare }) => {
                            onDragEnd?.();
                            return onDrop(sourceSquare, targetSquare ?? "");
                          },
                          boardStyle: {
                            borderRadius: "0px",
                          },
                          showNotation: false,
                          squareStyles: boardSquareStyles,
                          animationDurationInMs: 0,
                          allowDragging: isActive && boardIsInteractive,
                          squareRenderer: ({ square, piece, children }) => {
                            const isKing =
                              piece?.pieceType === "wK" ||
                              piece?.pieceType === "bK";
                            const isLosingKing =
                              isKing && square === losingKingSq;
                            const isWinningKing =
                              isKing && square === winningKingSq;

                            let className = "piece-normal-container";
                            if (isLosingKing) {
                              className = "king-defeated-container";
                            } else if (isWinningKing) {
                              className = "king-winning-container";
                            }

                            return <div className={className}>{children}</div>;
                          },
                        }}
                      />

                      {/* Move quality annotations */}
                      {isActive && (
                        <MoveAnnotation activeAnnotation={activeAnnotation} />
                      )}

                      {isActive && <BoardCoordinates boardOrientation="white" />}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </motion.div>
        {/* Carousel Prev/Next + Pagination Dots */}
        <div className="flex items-center justify-center gap-6 p-2 mt-1">
          <button
            onClick={toPrev}
            disabled={activeIndex === 0}
            className="p-2 rounded-full border text-[#8E8B82]
                       hover:text-white hover:border-[rgba(212,175,110,0.5)] hover:bg-white/5
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {CAROUSEL_ITEMS.map((_, i) => (
              <button
                key={i}
                onClick={() => toSlide(i)}
                className={`rounded-full transition-all duration-300 ${activeIndex === i
                  ? "w-5 h-1.5 bg-[#D4AF6E]"
                  : "w-1.5 h-1.5 bg-brand-secondary/40 hover:bg-brand-secondary"
                  }`}
              />
            ))}
          </div>
          <button
            onClick={toNext}
            disabled={activeIndex === CAROUSEL_ITEMS.length - 1}
            className="p-2 rounded-full border text-[#8E8B82]
                       hover:text-white hover:border-[rgba(212,175,110,0.5)] hover:bg-white/5
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute sound" : "Mute sound"}
          className="p-2 rounded-full border text-[#8E8B82]
             hover:text-white hover:border-[rgba(212,175,110,0.5)] hover:bg-white/5
             transition-all duration-200"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#D4AF6E]" />
          )}
        </button>
      </div>
      {/* Below-board Info Panel */}
      <div className="flex items-center justify-between px-0 mt-1">
        <div>
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[15px] font-sans text-white font-bold leading-tight">
              {descBottom}
            </span>
          </div>
        </div>

      </div>
      {/* Action Buttons */}
      <div className="flex gap-3 mt-1">
        {activeIndex === 0 ? (
          <>
            {phase0 === "AUTOPLAY" && (
              <button
                onClick={handleSkip0}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-[#0C1020] border border-[rgba(212,175,110,0.12)]
                  text-[#8E8B82] hover:text-white
                  hover:border-[rgba(212,175,110,0.4)] hover:bg-white/5
                  transition-all duration-200
                  btn-glow-container btn-glow-surface
                "
              >
                <SkipForward size={18} className="w-4 h-4 text-[#D4AF6E] animate-pulse" />
                Skip Animation
              </button>
            )}
            {phase0 === "PUZZLE" && (
              <>
                <button
                  onClick={() => {
                    setPuzzleStep0(0);
                    gameRef0.current = new Chess(PROCESSED_MOVES[39].fenAfter);
                    setGameFen0(gameRef0.current.fen());
                    setLastMove0({
                      from: PROCESSED_MOVES[39].from,
                      to: PROCESSED_MOVES[39].to,
                    });
                    setCheckedKingSquare0(null);
                    setIsStockfishThinking0(false);
                    setPlayMode0("SCRIPTED");
                    setPuzzleMoveIndex0(0);
                  }}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-[#0C1020] border border-[rgba(212,175,110,0.12)]
                    text-[#8E8B82] hover:text-white
                    hover:border-[rgba(212,175,110,0.4)] hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                >
                  <RotateCcw className="w-4 h-4 text-[#D4AF6E]" />
                  Reset
                </button>
                <button
                  onClick={handleReplay0}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-[#0C1020] border border-[rgba(212,175,110,0.12)]
                    text-[#8E8B82] hover:text-white
                    hover:border-[rgba(212,175,110,0.4)] hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                >
                  <RotateCcw className="w-4 h-4 text-[#D4AF6E]" />
                  Replay Game
                </button>
              </>
            )}
            {phase0 === "SUCCESS" && (
              <button
                onClick={handleReplay0}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  btn-premium-cta cta-shine
                  text-white
                  transition-all duration-200
                  btn-glow-container btn-glow-accent
                  group
                "
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform duration-300" />
                Replay
              </button>
            )}
          </>
        ) : activeIndex === 1 ? (
          <>
            {phase1 === "solving" && (
              <button
                disabled
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-[#0C1020] border border-[rgba(212,175,110,0.12)]
                  text-[#8E8B82] opacity-50
                  btn-glow-container btn-glow-surface
                "
              >
                <Play className="w-4 h-4 text-[#D4AF6E] animate-pulse" />
                Solving in Progress...
              </button>
            )}
            {(phase1 === "idle" ||
              phase1 === "white_moved" ||
              phase1 === "black_responding" ||
              phase1 === "awaiting_mate" ||
              phase1 === "failed") && (
                <>
                  <button
                    onClick={() => {
                      cleanupGame();
                      initGame(1);
                    }}
                    className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-[#0C1020] border border-[rgba(212,175,110,0.12)]
                    text-[#8E8B82] hover:text-white
                    hover:border-[rgba(212,175,110,0.4)] hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                  >
                    <RotateCcw className="w-4 h-4 text-[#D4AF6E]" />
                    Reset
                  </button>
                  <button
                    onClick={handleSolve1}
                    className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-[#0C1020] border border-[rgba(212,175,110,0.12)]
                    text-[#8E8B82] hover:text-white
                    hover:border-[rgba(212,175,110,0.4)] hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                  >
                    <Play className="w-4 h-4 text-[#D4AF6E]" />
                    Solve
                  </button>
                </>
              )}
            {phase1 === "solved" && (
              <button
                onClick={handleReplayOriginal}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  btn-premium-cta cta-shine
                  text-white
                  transition-all duration-200
                  btn-glow-container btn-glow-accent
                  group
                "
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform duration-300" />
                Replay
              </button>
            )}
          </>
        ) : activeIndex === 2 ? (
          /* Slide 2 Action Buttons */
          <>
            {phase2 === "black_responding" && (
              <button
                disabled
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-[#0C1020] border border-[rgba(212,175,110,0.12)]
                  text-[#8E8B82] opacity-50
                  btn-glow-container btn-glow-surface
                "
              >
                <Play className="w-4 h-4 text-[#D4AF6E] animate-pulse" />
                Black Responding...
              </button>
            )}
            {(phase2 === "idle" ||
              phase2 === "awaiting_move" ||
              phase2 === "failed") && (
                <>
                  <button
                    onClick={() => {
                      cleanupGame();
                      initGame(2);
                    }}
                    className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-[#0C1020] border border-[rgba(212,175,110,0.12)]
                    text-[#8E8B82] hover:text-white
                    hover:border-[rgba(212,175,110,0.4)] hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                  >
                    <RotateCcw className="w-4 h-4 text-[#D4AF6E]" />
                    Reset
                  </button>
                </>
              )}
            {phase2 === "solved" && (
              <button
                onClick={() => {
                  cleanupGame();
                  initGame(2);
                }}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  btn-premium-cta cta-shine
                  text-white
                  transition-all duration-200
                  btn-glow-container btn-glow-accent
                  group
                "
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform duration-300" />
                Replay
              </button>
            )}
          </>
        ) : (
          /* Slide 3 Action Buttons */
          <>
            {phase3 === "black_responding" && (
              <button
                disabled
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-[#0C1020] border border-[rgba(212,175,110,0.12)]
                  text-[#8E8B82] opacity-50
                  btn-glow-container btn-glow-surface
                "
              >
                <Play className="w-4 h-4 text-[#D4AF6E] animate-pulse" />
                Black Responding...
              </button>
            )}
            {(phase3 === "idle" ||
              phase3 === "awaiting_move" ||
              phase3 === "failed") && (
                <>
                  <button
                    onClick={() => {
                      cleanupGame();
                      initGame(3);
                    }}
                    className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-[#0C1020] border border-[rgba(212,175,110,0.12)]
                    text-[#8E8B82] hover:text-white
                    hover:border-[rgba(212,175,110,0.4)] hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                  >
                    <RotateCcw className="w-4 h-4 text-[#D4AF6E]" />
                    Reset
                  </button>
                </>
              )}
            {phase3 === "solved" && (
              <button
                onClick={() => {
                  cleanupGame();
                  initGame(3);
                }}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  btn-premium-cta cta-shine
                  text-white
                  transition-all duration-200
                  btn-glow-container btn-glow-accent
                  group
                "
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform duration-300" />
                Replay
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}