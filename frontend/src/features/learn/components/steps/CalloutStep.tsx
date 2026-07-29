import React from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Zap, AlertTriangle, Lightbulb, Star } from "lucide-react";

export const CalloutStep: React.FC<{ step: any }> = ({ step }) => {
  const cat = step.category || (
    step.title?.toLowerCase().includes("mistake") ? "COMMON_MISTAKE" :
    step.title?.toLowerCase().includes("tip") ? "PRO_TIP" :
    step.title?.toLowerCase().includes("remember") ? "THINGS_TO_REMEMBER" : "KEY_INSIGHT"
  );
  
  let theme = {
    color: "text-[#D4AF6E]",
    bg: "bg-[#D4AF6E]/10",
    border: "border-[#D4AF6E]/30",
    gradientFrom: "from-[#D4AF6E]/20",
    gradientLine: "via-[#D4AF6E]/60",
    icon: <Zap className="w-6 h-6 text-[#D4AF6E]" />,
    label: "Key Insight"
  };

  if (cat === "COMMON_MISTAKE") {
    theme = {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      gradientFrom: "from-red-500/20",
      gradientLine: "via-red-500/60",
      icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
      label: "Common Mistake"
    };
  } else if (cat === "PRO_TIP") {
    theme = {
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/30",
      gradientFrom: "from-amber-400/20",
      gradientLine: "via-amber-400/60",
      icon: <Star className="w-6 h-6 text-amber-400" />,
      label: "Pro Tip"
    };
  } else if (cat === "THINGS_TO_REMEMBER") {
    theme = {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      gradientFrom: "from-blue-500/20",
      gradientLine: "via-blue-500/60",
      icon: <Lightbulb className="w-6 h-6 text-blue-400" />,
      label: "Things to Remember"
    };
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[45vh] w-full"
    >
      {/* Step type label */}
      <div className="flex items-center gap-2 mb-6 w-full">
        <div className={`w-1 h-6 rounded-full ${theme.color.replace('text-', 'bg-')}`} />
        <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${theme.color}`}>{theme.label}</span>
      </div>

      <div className={`relative w-full overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} backdrop-blur-xl p-8 md:p-10 shadow-2xl shadow-black/50`}>
        {/* Animated background shimmer & Noise */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradientFrom} via-transparent to-transparent pointer-events-none`} />
        
        {/* Left accent border */}
        <div className={`absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-transparent ${theme.gradientLine} to-transparent opacity-80`} />

        <div className="relative flex flex-col md:flex-row items-start gap-6">
          {/* Icon */}
          <div className={`flex-shrink-0 w-14 h-14 rounded-2xl border ${theme.border} bg-black/40 flex items-center justify-center shadow-lg`}>
            {theme.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-1">
            {step.title && (
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-white">{step.title}</h3>
            )}
            <div className="prose prose-invert max-w-none prose-p:text-white/80 prose-p:leading-[1.8] prose-p:text-[17px] prose-strong:text-white prose-strong:font-bold">
              <ReactMarkdown>{step.body}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
