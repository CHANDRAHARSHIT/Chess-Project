import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export type CoachEmotion = "neutral" | "happy" | "thinking" | "explaining";

interface CoachPanelProps {
  message: string;
  emotion?: CoachEmotion;
  delay?: number;
  className?: string;
  layoutId?: string;
}

export const CoachPanel: React.FC<CoachPanelProps> = ({ message, emotion = "neutral", delay = 0.1, className = "", layoutId }) => {
  const [displayedText, setDisplayedText] = useState("");

  // Typing effect animation for incoming coach messages
  useEffect(() => {
    setDisplayedText("");
    if (!message) return;

    let index = 0;
    const speed = 12; // ms per char
    const timer = setInterval(() => {
      index += 2; // reveal 2 chars at a time for fast & responsive feel
      if (index >= message.length) {
        setDisplayedText(message);
        clearInterval(timer);
      } else {
        setDisplayedText(message.slice(0, index));
      }
    }, speed);

    return () => clearInterval(timer);
  }, [message]);

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative p-5 rounded-2xl bg-[#D4AF6E]/10 border border-[#D4AF6E]/30 backdrop-blur-xl overflow-hidden shadow-xl ${className}`}
    >
      {/* Noise Texture & Gold Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,110,0.12),transparent)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[1px] bg-gradient-to-r from-transparent via-[#D4AF6E]/50 to-transparent" />
      
      <div className="relative flex items-start gap-3.5">
        {/* Avatar */}
        <motion.div
          animate={
            emotion === "happy" ? { y: [0, -5, 0], scale: [1, 1.08, 1] } :
            emotion === "thinking" ? { rotate: [0, -6, 6, 0] } :
            { y: 0, scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#E8C88A] to-[#D4AF6E] text-[#080B14] font-black text-sm flex items-center justify-center shadow-[0_0_20px_rgba(212,175,110,0.3)] border border-[#F3D08A]"
        >
          <span>GM</span>
        </motion.div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="text-xs font-bold text-[#D4AF6E] tracking-wide">Coach Alex</h4>
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#D4AF6E] bg-[#D4AF6E]/15 border border-[#D4AF6E]/30 px-1.5 py-0.5 rounded-md">
              Grandmaster
            </span>
          </div>
          
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={message}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="prose prose-invert prose-sm max-w-none prose-p:text-white/85 prose-p:leading-[1.75] prose-strong:text-[#D4AF6E] prose-strong:font-bold"
              >
                <ReactMarkdown>{displayedText}</ReactMarkdown>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
