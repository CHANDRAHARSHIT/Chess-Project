import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLessonContext } from "../../context/LessonContext";
import { Check, X, HelpCircle, Lightbulb, Image as ImageIcon } from "lucide-react";
import { ThemedChessboard } from "../../../../components/ThemedChessboard";
import { CoachPanel } from "../CoachPanel";

export const QuizStep: React.FC<{ step: any }> = ({ step }) => {
  const { engine } = useLessonContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);

  const handleSelect = useCallback((optId: string) => {
    if (isCorrect) return;
    setSelectedId(optId);

    const correct = engine.handleQuizOption(optId);

    if (correct) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
      setWrongIds(prev => new Set([...prev, optId]));
      // Reset selection after shake so user can try another option
      setTimeout(() => setSelectedId(null), 700);
    }
  }, [isCorrect, engine]);

  const hasBoard = !!step.fen;
  const isTrueFalse = step.quizType === "TRUE_FALSE";
  const options = step.options || (isTrueFalse ? [
    { id: "opt-true", text: "True" },
    { id: "opt-false", text: "False" }
  ] : []);

  return (
    <div className={`flex flex-col lg:flex-row gap-8 items-start mx-auto w-full ${hasBoard ? "max-w-5xl" : "max-w-3xl"}`}>
      
      {/* Optional Board Position or Image */}
      {hasBoard && (
        <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden border border-[#D4AF6E]/30 shadow-[0_24px_60px_rgba(0,0,0,0.7)] bg-[#080B14]">
            <ThemedChessboard
              options={{
                position: step.fen,
                arePiecesDraggable: false,
                showNotation: true,
              }}
            />
          </div>
          <p className="text-xs text-center text-white/40 font-mono">Position for question reference</p>
        </div>
      )}

      {step.imageUrl && (
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <div className="relative rounded-2xl overflow-hidden border border-[#D4AF6E]/30 shadow-2xl">
            <img src={step.imageUrl} alt="Quiz Diagram" className="w-full h-auto object-cover" />
          </div>
        </div>
      )}

      {/* Quiz Content */}
      <div className="flex-1 flex flex-col gap-6 w-full">
        
        {/* Step Header */}
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-1 h-6 rounded-full bg-purple-400" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-400">
              {isTrueFalse ? "True / False Quiz" : hasBoard ? "Board Challenge" : "Knowledge Check"}
            </span>
          </motion.div>

          {step.hint && !isCorrect && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#D4AF6E] bg-[#D4AF6E]/10 border border-[#D4AF6E]/20 hover:bg-[#D4AF6E]/20 transition-all"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showHint ? "Hide Hint" : "Hint"}
            </button>
          )}
        </div>

        {/* Hint Box */}
        <AnimatePresence>
          {showHint && step.hint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-[#D4AF6E]/10 border border-[#D4AF6E]/30 text-xs text-[#D4AF6E] leading-relaxed"
            >
              💡 <strong>Hint:</strong> {step.hint}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <HelpCircle className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            {step.question}
          </h2>
        </motion.div>

        {/* Options Grid */}
        <div className={`grid gap-3.5 ${isTrueFalse ? "grid-cols-2" : "grid-cols-1"}`}>
          {options.map((opt: any, i: number) => {
            const isSelected = selectedId === opt.id;
            const isThisCorrect = isCorrect && (opt.id === step.correct || opt.isCorrect);
            const isThisWrong = wrongIds.has(opt.id);

            return (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, x: -8 }}
                animate={isSelected && !isThisCorrect && !isThisWrong ? { x: [0, -6, 6, -6, 6, 0] } : { opacity: 1, x: 0 }}
                transition={isSelected && !isThisCorrect && !isThisWrong ? { duration: 0.4 } : { delay: 0.1 + i * 0.05 }}
                whileHover={!isCorrect && !isThisWrong ? { scale: 1.015, translateX: 2 } : {}}
                whileTap={!isCorrect && !isThisWrong ? { scale: 0.98 } : {}}
                onClick={() => handleSelect(opt.id)}
                disabled={!!isCorrect}
                className={`
                  relative flex items-center justify-between w-full px-5 py-4 rounded-2xl border text-left transition-all duration-200 group overflow-hidden
                  ${isThisCorrect
                    ? "bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-[1.01]"
                    : isThisWrong
                      ? "bg-red-500/10 border-red-500/30 opacity-50 cursor-not-allowed"
                      : isSelected
                        ? "bg-purple-500/20 border-purple-500/50"
                        : "bg-white/[0.03] border-white/10 hover:border-[#D4AF6E]/40 hover:bg-[#D4AF6E]/5"
                  }
                `}
              >
                {/* Option Index / Letter */}
                {!isTrueFalse && (
                  <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mr-4 transition-colors shadow-sm
                    ${isThisCorrect ? "bg-emerald-500 text-black" :
                      isThisWrong ? "bg-red-500/20 text-red-400" :
                      "bg-white/10 text-white/60 group-hover:bg-[#D4AF6E]/20 group-hover:text-[#D4AF6E]"}
                  `}>
                    {String.fromCharCode(65 + i)}
                  </span>
                )}

                <span className={`flex-1 text-base font-semibold transition-colors ${
                  isThisCorrect ? "text-emerald-300" : isThisWrong ? "text-red-200/50" : "text-white/80 group-hover:text-white"
                }`}>
                  {opt.text}
                </span>

                {isThisCorrect && <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 ml-3 drop-shadow-md" />}
                {isThisWrong && <X className="w-5 h-5 text-red-400 flex-shrink-0 ml-3" />}
              </motion.button>
            );
          })}
        </div>

        {/* Coach Explanation */}
        <AnimatePresence>
          {isCorrect && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden pt-2"
            >
              <CoachPanel 
                message={`**Correct!**\n\n${step.explanation || "Well done on answering this quiz correctly!"}`} 
                emotion="happy" 
                delay={0}
                className="border-emerald-500/30 bg-emerald-500/10 shadow-[0_10px_40px_rgba(16,185,129,0.1)]" 
              />
              <motion.div className="flex justify-end mt-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => engine.nextStep()}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#D4AF6E] hover:bg-[#B8934A] text-[#080B14] font-bold text-sm shadow-lg shadow-[#D4AF6E]/20 transition-all"
                >
                  Continue
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
