import React from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { CoachPanel } from "../CoachPanel";

export const TextStep: React.FC<{ step: any }> = ({ step }) => {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Step type indicator */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2"
      >
        <div className="w-1 h-6 rounded-full bg-[#D4AF6E]/50" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF6E]/50">Reading</span>
      </motion.div>

      {/* Title */}
      {step.title && (
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight"
        >
          {step.title}
        </motion.h2>
      )}

      {/* Body */}
      {step.body && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="prose prose-invert max-w-none prose-p:text-white/60 prose-p:leading-[1.85] prose-p:text-[17px] prose-strong:text-white prose-strong:font-semibold prose-headings:text-white/90"
        >
          <ReactMarkdown>{step.body}</ReactMarkdown>
        </motion.div>
      )}

      {/* Coach message */}
      {step.coachMessage && (
        <CoachPanel message={step.coachMessage} emotion="explaining" delay={0.2} />
      )}
    </div>
  );
};
