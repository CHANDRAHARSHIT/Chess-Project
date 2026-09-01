import React from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Search,
  BookOpen,
  TrendingUp,
  Target,
  Palette,
  ArrowRight,
} from "lucide-react";

export interface MembershipFeatureBannerProps {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  reverse: boolean;
  buttonText: string;
  onButtonClick?: () => void;
}

export const MembershipFeatureBanner: React.FC<
  MembershipFeatureBannerProps
> = ({
  title,
  subtitle,
  description,
  image,
  reverse,
  buttonText,
  onButtonClick,
}) => {
  // Helper to render the appropriate Lucide icon as a premium placeholder
  const renderImagePlaceholder = () => {
    const iconClass = "w-24 h-24 sm:w-32 sm:h-32 text-sky-300/80";
    switch (image) {
      case "bot":
        return <Bot className={iconClass} />;
      case "search":
        return <Search className={iconClass} />;
      case "book-open":
        return <BookOpen className={iconClass} />;
      case "trending-up":
        return <TrendingUp className={iconClass} />;
      case "target":
        return <Target className={iconClass} />;
      case "palette":
        return <Palette className={iconClass} />;
      default:
        return <Bot className={iconClass} />;
    }
  };

  const handleUpgradeClick = () => {
    if (onButtonClick) {
      onButtonClick();
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="w-full max-w-6xl mx-auto py-16 sm:py-24 px-2.5 sm:px-6 z-10 relative overflow-hidden">
      <div
        className={`flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24 ${reverse ? "md:flex-row-reverse" : ""}`}
      >
        {/* Text Content */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
          <span className="text-sky-400 font-mono text-xs sm:text-sm uppercase tracking-widest font-semibold mb-3">
            {subtitle}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-brand-text mb-6 tracking-tight">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-brand-secondary font-sans mb-8 leading-relaxed max-w-lg">
            {description}
          </p>
          <button
            onClick={handleUpgradeClick}
            className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-text/5 hover:bg-sky-500/10 border border-brand-border hover:border-sky-400/50 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold text-brand-secondary hover:text-sky-300 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              {buttonText}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400/0 via-sky-400/5 to-sky-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </div>

        {/* Image/Illustration Placeholder */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="relative w-full max-w-[400px] aspect-square rounded-3xl bg-gradient-to-br from-brand-surface/80 to-brand-bg/50 border border-brand-border/60 backdrop-blur-sm flex items-center justify-center overflow-hidden group">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-sky-300/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-sky-300/20 transition-colors duration-500" />
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-brand-accent/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-brand-accent/10 transition-colors duration-500" />

            {/* Floating Animation for the Icon */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {renderImagePlaceholder()}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
