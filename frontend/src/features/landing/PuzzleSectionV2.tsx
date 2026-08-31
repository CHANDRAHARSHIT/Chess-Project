import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import { Chess } from "chess.js";
import { Sparkles } from "lucide-react";
import { ThemedChessboard } from "@/shared/ui/ThemedChessboard";
import { BoardCoordinates } from "@/shared/ui/BoardCoordinates";
import { soundManager } from "@/shared/lib/SoundManager";
import { useScrollReveal } from "@/shared/hooks/useScrollReveal";
import {
  CoachChatBox,
  type CoachMessage,
} from "@/features/puzzles/components/CoachChatBox";

const INITIAL_FEN = "r5k1/6pp/r7/q3N1P1/3Q4/1Pp5/2P5/1K1R3R w - - 0 1";

const INITIAL_MESSAGES: CoachMessage[] = [
  {
    id: 1,
    text: "White can win here. Give it a try. I'll help.",
    type: "default",
  },
];

export default function PuzzleSectionV2() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  // Chess game reference - mutated in place to prevent unnecessary remounts
  const gameRef = useRef(new Chess(INITIAL_FEN));
  const [gameFen, setGameFen] = useState<string>(INITIAL_FEN);

  // Puzzle progression & UI state
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [isSolved, setIsSolved] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWrongOverlay, setShowWrongOverlay] = useState(false);
  const [queenSliding, setQueenSliding] = useState(false);
  const [coachMessages, setCoachMessages] =
    useState<CoachMessage[]>(INITIAL_MESSAGES);

  // Animation reveal
  useScrollReveal(contentRef as React.RefObject<Element>, {
    y: 45,
    duration: 0.85,
  });
  useScrollReveal(visualRef as React.RefObject<Element>, {
    y: 45,
    duration: 0.85,
    delay: 0.1,
  });

  const addCoachMessage = useCallback(
    (text: string, type: "default" | "correct" | "hint" = "default") => {
      setCoachMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          text,
          type,
        },
      ]);
    },
    [],
  );

  // Reset entire puzzle state
  const handleReset = useCallback(() => {
    soundManager.playButtonClick();
    gameRef.current = new Chess(INITIAL_FEN);
    setGameFen(INITIAL_FEN);
    setStage(1);
    setIsSolved(false);
    setIsAnimating(false);
    setShowWrongOverlay(false);
    setQueenSliding(false);
    setCoachMessages([
      {
        id: Date.now(),
        text: "White can win here. Give it a try. I'll help.",
        type: "default",
      },
    ]);
  }, []);

  // Execute wrong-move sequence for Stage 1 (popup + arrow + queen slide + restore)
  const triggerWrongMoveSequence = useCallback(() => {
    setIsAnimating(true);
    addCoachMessage(
      "This gives Black a free move. Try looking for checks.",
      "hint",
    );
    setShowWrongOverlay(true);

    // Trigger sliding animation after frame renders
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setQueenSliding(true);
      });
    });

    // Reset back to original position after demonstration
    setTimeout(() => {
      setShowWrongOverlay(false);
      setQueenSliding(false);

      gameRef.current = new Chess(INITIAL_FEN);
      setGameFen(INITIAL_FEN);
      setIsAnimating(false);

      addCoachMessage(
        "Try looking for checks. Don't give Black any free moves.",
        "hint",
      );
    }, 4500);
  }, [addCoachMessage]);

  // Handle piece drop validation and puzzle rules
  const handlePieceDrop = useCallback(
    (args: { sourceSquare: string; targetSquare: string }): boolean => {
      const { sourceSquare, targetSquare } = args;

      // Prevent interaction if puzzle is completed, animating, or not White's turn
      if (isSolved || isAnimating) return false;
      if (gameRef.current.turn() !== "w") return false;

      // Validate against strict chess rules first using chess.js
      let move;
      try {
        move = gameRef.current.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
      } catch {
        return false;
      }

      if (!move) return false;

      // Valid legal move accepted by chess.js
      setGameFen(gameRef.current.fen());

      const moveSan = move.san.replace(/[+#]/g, "");

      // ── STAGE 1 LOGIC ──
      if (stage === 1) {
        if (
          moveSan === "Qc4" ||
          (sourceSquare === "d4" && targetSquare === "c4")
        ) {
          soundManager.playCheck();
          addCoachMessage("You found the first move! Very good!", "correct");
          setIsAnimating(true);

          // Black response: King retreats to h8
          setTimeout(() => {
            try {
              const oppMove = gameRef.current.move({ from: "g8", to: "h8" });
              if (oppMove) {
                setGameFen(gameRef.current.fen());
                soundManager.playMove();
                addCoachMessage(
                  "Black king hides in the corner for safety. Can you find the next move?",
                  "hint",
                );
                setStage(2);
              }
            } finally {
              setIsAnimating(false);
            }
          }, 700);
          return true;
        }

        if (
          moveSan === "Qd5" ||
          (sourceSquare === "d4" && targetSquare === "d5")
        ) {
          soundManager.playMove();
          addCoachMessage("You're on the right track ...", "hint");
          setIsAnimating(true);

          // Undo after brief pause
          setTimeout(() => {
            gameRef.current.undo();
            setGameFen(gameRef.current.fen());
            setIsAnimating(false);
          }, 600);
          return true;
        }

        // Any other move allows Black's lethal counter (Qa1#)
        if (move.captured) {
          soundManager.playCapture();
        } else {
          soundManager.playMove();
        }
        triggerWrongMoveSequence();
        return true;
      }

      // ── STAGE 2 LOGIC ──
      if (stage === 2) {
        if (
          moveSan === "Nf7" ||
          (sourceSquare === "e5" && targetSquare === "f7")
        ) {
          soundManager.playCheck();
          addCoachMessage("Correct!", "correct");
          setIsAnimating(true);

          // Black response: King steps back to g8
          setTimeout(() => {
            try {
              const oppMove = gameRef.current.move({ from: "h8", to: "g8" });
              if (oppMove) {
                setGameFen(gameRef.current.fen());
                soundManager.playMove();
              }
            } finally {
              setTimeout(() => {
                soundManager.playApplause();
                addCoachMessage(
                  "Puzzle complete! Brilliant tactical calculation.",
                  "correct",
                );
                setStage(3);
                setIsSolved(true);
                setIsAnimating(false);
              }, 400);
            }
          }, 700);
          return true;
        }

        // Wrong move on Stage 2
        addCoachMessage("Wrong.", "hint");
        setIsAnimating(true);
        setTimeout(() => {
          gameRef.current.undo();
          setGameFen(gameRef.current.fen());
          setIsAnimating(false);
        }, 500);
        return true;
      }

      return true;
    },
    [stage, isSolved, isAnimating, addCoachMessage, triggerWrongMoveSequence],
  );

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-22 overflow-hidden"
      id="puzzles-v2-section"
      aria-label="Chess Puzzles Section"
    >
      {/* Subtle section background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ background: "var(--obsidian)" }}
        aria-hidden="true"
      />

      <div className="max-w-[1275px] mx-auto px-2 sm:px-6 lg:px-8 relative z-10">
        {/*
          Banner Grid: content left (~0.75fr) | visual preview right (~1.55fr)
          Mobile: stacked (content first → board & coach below)
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[0.75fr_1.55fr] items-center gap-10 lg:gap-16">
          {/* ── Left Column: Text & Explore Button ─────────────────────── */}
          <div
            ref={contentRef}
            className="max-w-[460px] text-left"
            style={{ opacity: 0 }}
          >
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(32px, 3vw, 49px)",
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Level Up with Puzzles
            </h2>

            <p
              className="font-sans leading-relaxed"
              style={{
                fontSize: "clamp(15px, 1.25vw, 20px)",
                color: "var(--text-secondary)",
                maxWidth: 408,
                marginBottom: "30px",
                lineHeight: 1.45,
              }}
            >
              Train your tactics or just have fun.
            </p>

            <Link
              to="/puzzles"
              id="puzzles-v2-explore-btn"
              className="inline-flex items-center justify-center font-sans font-bold rounded-[12px] cta-shine"
              style={{
                width: "min(100%, 320px)",
                minHeight: "61px",
                fontSize: "clamp(18px, 1.5vw, 24px)",
                border: "1px solid var(--marble-border)",
                background:
                  "linear-gradient(135deg, rgba(212,175,110,0.10) 0%, rgba(212,175,110,0.04) 100%)",
                color: "var(--gold-bright)",
                transition:
                  "transform 0.15s ease, background 0.15s ease, border-color 0.15s ease",
                display: "inline-flex",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--marble-border-strong)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--marble-border)";
              }}
            >
              Explore
            </Link>
          </div>

          {/* ── Right Column: Visual Frame (Chessboard + Coach Panel) ──── */}
          <div
            ref={visualRef}
            className="w-full max-w-[760px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_260px] gap-4 sm:gap-5 items-stretch"
            style={{ opacity: 0 }}
            aria-label="Interactive puzzle preview"
          >
            {/* 1. Chessboard Container */}
            <div
              className="relative aspect-square w-full rounded-sm overflow-hidden flex flex-col justify-center"
              style={{
                border: "1px solid var(--marble-border)",
                background: "var(--glass-bg)",
              }}
            >
              <ThemedChessboard
                options={{
                  position: gameFen,
                  boardOrientation: "white",
                  onPieceDrop: handlePieceDrop,
                  allowDragging: !isAnimating && !isSolved,
                  showNotation: false,
                }}
              />

              <BoardCoordinates boardOrientation="white" />

              {/* Wrong Move Demonstration Overlay: Red Arrow & Popup */}
              {showWrongOverlay && (
                <>
                  {/* SVG Threat Arrow pointing a5 -> a1 */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-20"
                    viewBox="0 0 100 100"
                  >
                    <defs>
                      <marker
                        id="redArrowHead"
                        markerWidth="6"
                        markerHeight="6"
                        refX="5"
                        refY="3"
                        orient="auto"
                      >
                        <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
                      </marker>
                    </defs>
                    <line
                      x1="6.25"
                      y1="43.75"
                      x2="6.25"
                      y2="91.5"
                      stroke="#ef4444"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      opacity="0.9"
                      markerEnd="url(#redArrowHead)"
                    />
                  </svg>

                  {/* Warning Popup Banner */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[85%] max-w-[340px] px-4 py-3 rounded-xl bg-neutral-950/92 border border-red-500/40 text-white font-bold text-center text-sm sm:text-base shadow-2xl backdrop-blur-md transition-all duration-200">
                    This gives Black a free move.
                  </div>

                  {/* Animated Black Queen sliding down from a5 to a1 */}
                  <div
                    className="absolute z-25 pointer-events-none flex items-center justify-center transition-transform duration-[1100ms] ease-[cubic-bezier(0.2,0.8,0.25,1)]"
                    style={{
                      left: "0%",
                      top: "37.5%",
                      width: "12.5%",
                      height: "12.5%",
                      transform: queenSliding
                        ? "translateY(400%)"
                        : "translateY(0%)",
                    }}
                  >
                    <img
                      src="/pieces/maestro/bQ.svg"
                      alt="Black Queen"
                      className="w-[88%] h-[88%] object-contain drop-shadow-md"
                    />
                  </div>
                </>
              )}

              {/* Solved Celebration Overlay */}
              {isSolved && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-sm sm:text-base shadow-lg animate-bounce">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Solved!
                  </div>
                </div>
              )}
            </div>

            {/* 2. Coach Module Side Panel (Extracted Reusable Component) */}
            <CoachChatBox messages={coachMessages} onReset={handleReset} />
          </div>
        </div>
      </div>
    </section>
  );
}
