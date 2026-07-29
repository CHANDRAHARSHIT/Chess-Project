import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLessonContext } from "../../context/LessonContext";
import { ThemedChessboard } from "../../../../components/ThemedChessboard";
import { Check, X, Lightbulb, RotateCcw, FlipHorizontal } from "lucide-react";
import { CoachPanel } from "../CoachPanel";

const XpFloat: React.FC<{ onDone: () => void }> = ({ onDone }) => (
  <motion.div
    initial={{ opacity: 0, y: 0, scale: 0.7 }}
    animate={{ opacity: [0, 1, 1, 0], y: -60, scale: [0.7, 1.2, 1.2, 0.8] }}
    transition={{ duration: 1.2, ease: "easeOut" }}
    onAnimationComplete={onDone}
    className="absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none z-20
      text-[#D4AF6E] font-black text-xl select-none drop-shadow-[0_0_12px_rgba(212,175,110,0.8)]"
  >
    +10 XP ✨
  </motion.div>
);

export const BoardStep: React.FC<{ step: any }> = ({ step }) => {
  const { engine, engineState } = useLessonContext();
  const { boardState, coach, stepStats, status } = engineState;
  
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
  const [showXp, setShowXp] = useState(false);
  const [wrongMoveAnim, setWrongMoveAnim] = useState(false);
  
  // Click-to-move state
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);

  // Trigger XP animation when completed
  useEffect(() => {
    if (status === "completed") {
      setShowXp(true);
      setSelectedSquare(null);
      setLegalTargets([]);
    }
  }, [status]);

  // Reset click selections when board FEN changes
  useEffect(() => {
    setSelectedSquare(null);
    setLegalTargets([]);
  }, [boardState.fen]);

  // Trigger shake animation when a mistake is made
  useEffect(() => {
    if (stepStats.mistakes > 0 && status === "playing") {
      setWrongMoveAnim(true);
      setSelectedSquare(null);
      setLegalTargets([]);
      const t = setTimeout(() => setWrongMoveAnim(false), 500);
      return () => clearTimeout(t);
    }
  }, [stepStats.mistakes, status]);

  const isCorrect = status === "completed";
  const isValidating = status === "validating";
  const outOfAttempts = stepStats.attempts <= 0 && !isCorrect;

  // Handle Drag and Drop
  const handlePieceDrop = useCallback((args: any, targetSquareArg?: string, pieceArg?: string): boolean => {
    if (isCorrect || isValidating || outOfAttempts) return false;

    let source = "";
    let target = "";
    let p = "q";

    if (typeof args === "object" && args !== null && args.sourceSquare) {
      source = args.sourceSquare;
      target = args.targetSquare || "";
      p = args.piece?.[1]?.toLowerCase() || "q";
    } else if (typeof args === "string") {
      source = args;
      target = targetSquareArg || "";
      p = pieceArg?.[1]?.toLowerCase() || "q";
    }

    if (!source || !target) return false;

    setSelectedSquare(null);
    setLegalTargets([]);
    return engine.handleMove(source, target, p);
  }, [engine, isCorrect, isValidating, outOfAttempts]);

  // Handle Square Clicks (Click-to-Move)
  const handleSquareClick = useCallback((args: any) => {
    if (isCorrect || isValidating || outOfAttempts) return;

    let square = "";
    if (typeof args === "string") {
      square = args;
    } else if (typeof args === "object" && args !== null) {
      square = args.square || args.sourceSquare || "";
    }

    if (!square) return;

    // If a piece is already selected and user clicks one of its legal target squares:
    if (selectedSquare && legalTargets.includes(square)) {
      engine.handleMove(selectedSquare, square);
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    // Otherwise, select the new square and find its legal moves
    const targets = engine.getLegalMoves(square);
    if (targets.length > 0) {
      setSelectedSquare(square);
      setLegalTargets(targets);
    } else {
      setSelectedSquare(null);
      setLegalTargets([]);
    }
  }, [selectedSquare, legalTargets, engine, isCorrect, isValidating, outOfAttempts]);

  // Custom square styles and arrows for last move, selection, dots & hints
  const { squareStyles, arrows } = useMemo(() => {
    const styles: Record<string, any> = {};
    const arr: [string, string, string][] = [];
    
    // Last move highlight
    if (boardState.lastMove) {
      styles[boardState.lastMove.from] = { backgroundColor: "rgba(212, 175, 110, 0.35)" };
      styles[boardState.lastMove.to] = { backgroundColor: "rgba(212, 175, 110, 0.55)" };
    }

    // Selected square highlight
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: "rgba(212, 175, 110, 0.6)",
        boxShadow: "inset 0 0 10px rgba(212, 175, 110, 0.8)",
      };
    }

    // Legal move target dots
    legalTargets.forEach(tgt => {
      styles[tgt] = {
        background: "radial-gradient(circle, rgba(212, 175, 110, 0.85) 25%, transparent 28%)",
        borderRadius: "50%",
      };
    });

    // Visual Hints
    if (stepStats.hintsUsed >= 1 && step.expectedMoves?.[0] && !isCorrect) {
      const uci = step.expectedMoves[0];
      const from = uci.substring(0, 2);
      const to = uci.substring(2, 4);
      
      if (stepStats.hintsUsed === 1) {
        styles[from] = { backgroundColor: "rgba(52, 211, 153, 0.45)", borderRadius: "8px" };
      } else if (stepStats.hintsUsed >= 2) {
        arr.push([from, to, "rgba(52, 211, 153, 0.85)"]);
      }
    }
    
    return { squareStyles: styles, arrows: arr };
  }, [boardState.lastMove, selectedSquare, legalTargets, stepStats.hintsUsed, step.expectedMoves, isCorrect]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start max-w-5xl mx-auto w-full">
      {/* Board area */}
      <div className="flex-1 flex flex-col gap-4 items-center w-full">
        {/* Objective bar */}
        <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#D4AF6E]/10 border border-[#D4AF6E]/25 backdrop-blur-md shadow-lg shadow-[#080B14]/50">
          <div className="relative flex-shrink-0 w-2.5 h-2.5">
            <div className="absolute inset-0 rounded-full bg-[#D4AF6E] animate-ping opacity-75" />
            <div className="relative rounded-full w-2.5 h-2.5 bg-[#D4AF6E]" />
          </div>
          <p className="text-sm text-[#D4AF6E] font-medium">
            {step.title || "Your move — find the best continuation"}
          </p>
        </div>

        {/* Board wrapper */}
        <motion.div
          animate={wrongMoveAnim ? { x: [-6, 6, -5, 5, -3, 3, 0] } : {}}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative w-full max-w-[480px] aspect-square group"
        >
          {/* Ambient Glow */}
          <div className={`absolute inset-[-20px] rounded-[40px] blur-3xl transition-all duration-700 pointer-events-none ${
            isCorrect
              ? "bg-emerald-500/30 scale-105"
              : wrongMoveAnim
                ? "bg-red-500/20 scale-105"
                : "bg-[#D4AF6E]/15 scale-100 group-hover:bg-[#D4AF6E]/20"
          }`} />

          {/* Board container */}
          <div className={`relative rounded-xl overflow-hidden transition-all duration-300 shadow-[0_32px_80px_rgba(0,0,0,0.7)] ${
            isCorrect ? "border-[2px] border-emerald-500/60" : wrongMoveAnim ? "border-[2px] border-red-500/40" : "border-[1px] border-[#D4AF6E]/30 group-hover:border-[#D4AF6E]/50"
          }`}>
            <ThemedChessboard
              options={{
                position: boardState.fen,
                boardOrientation,
                onPieceDrop: handlePieceDrop,
                onSquareClick: handleSquareClick,
                animationDuration: 250,
                showNotation: true,
                customSquareStyles: squareStyles,
                customArrows: arrows,
                arePiecesDraggable: !isCorrect && !isValidating && !outOfAttempts
              }}
            />

            {/* XP float */}
            <AnimatePresence>
              {showXp && <XpFloat onDone={() => setShowXp(false)} />}
            </AnimatePresence>

            {/* Hint overlay */}
            <AnimatePresence>
              {stepStats.hintsUsed > 0 && step.hint && !isCorrect && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  className="absolute bottom-2 left-2 right-2 rounded-xl bg-black/90 backdrop-blur-md border border-[#D4AF6E]/40 text-[#D4AF6E] text-center text-xs font-medium py-3 px-4 shadow-2xl z-20"
                >
                  <span className="mr-2">💡</span>{step.hint}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Validating overlay */}
            <AnimatePresence>
              {isValidating && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#080B14]/40 backdrop-blur-[2px] flex items-center justify-center z-10"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-[#D4AF6E]/20 border-t-[#D4AF6E] animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Out of attempts overlay */}
            <AnimatePresence>
              {outOfAttempts && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-red-950/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center"
                >
                  <X className="w-12 h-12 text-red-400 mb-3 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]" />
                  <p className="text-white font-bold text-lg mb-1">Let's try that again!</p>
                  <p className="text-xs text-white/60 mb-4 max-w-xs">Look closely at the key defense or attack target.</p>
                  <button onClick={() => engine.resetBoard()} className="px-6 py-2.5 bg-[#D4AF6E] text-[#080B14] font-bold rounded-xl hover:bg-[#B8934A] transition-all shadow-lg">
                    Reset Board & Retry
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Board controls & Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-[480px] gap-4 mt-2">
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs font-mono text-white/50">
            <span>Attempts: <strong className={stepStats.attempts === 1 ? "text-red-400 font-bold" : "text-[#D4AF6E]"}>{stepStats.attempts}</strong></span>
            <span>Moves: <strong className="text-[#D4AF6E]">{boardState.history.length - 1}</strong></span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => engine.undoMove()}
              disabled={boardState.history.length <= 1 || isCorrect}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/50 hover:text-[#D4AF6E] hover:bg-[#D4AF6E]/10 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-medium border border-transparent hover:border-[#D4AF6E]/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              onClick={() => setBoardOrientation(o => o === "white" ? "black" : "white")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/50 hover:text-[#D4AF6E] hover:bg-[#D4AF6E]/10 transition-all text-xs font-medium border border-transparent hover:border-[#D4AF6E]/20"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              Flip
            </button>
            {step.hint && (
              <button
                onClick={() => engine.requestHint()}
                disabled={stepStats.hintsUsed > 0 || isCorrect}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#D4AF6E] bg-[#D4AF6E]/10 hover:bg-[#D4AF6E]/20 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-semibold border border-[#D4AF6E]/25 shadow-sm"
              >
                <Lightbulb className="w-3.5 h-3.5 text-[#D4AF6E]" />
                Hint
              </button>
            )}
          </div>
        </div>

        {/* Feedback card */}
        <AnimatePresence>
          {isCorrect && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[480px] p-5 rounded-2xl border flex items-start gap-4 bg-emerald-500/10 border-emerald-500/30 backdrop-blur-sm shadow-[0_8px_30px_rgba(16,185,129,0.15)]"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/40">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-emerald-400 mb-1.5 text-base">Brilliant move!</p>
                <p className="text-sm text-white/70 leading-relaxed">{step.successMessage || "That is exactly what we were looking for."}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => engine.nextStep()}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-[#D4AF6E] hover:bg-[#B8934A] text-[#080B14] font-bold text-sm transition-colors shadow-lg shadow-[#D4AF6E]/20"
              >
                Continue
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Coach panel — right of board */}
      <div className="lg:w-[300px] flex-shrink-0 w-full">
        <CoachPanel 
          message={coach.message} 
          emotion={coach.emotion}
          delay={0.1}
          className="shadow-2xl shadow-black/40 border-[#D4AF6E]/25" 
        />
      </div>
    </div>
  );
};
