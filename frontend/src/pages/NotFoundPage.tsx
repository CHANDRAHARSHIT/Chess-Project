import { useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Home, Compass, HelpCircle, ArrowRight } from "lucide-react";
import { suggestRoute } from "@/utils/router-routeMatcher";

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Run suggestion check on the requested pathname
  const suggestion = suggestRoute(location.pathname);

  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none relative overflow-hidden">
      {/* Background ambient lighting and subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[800px] h-[400px] bg-gradient-to-r from-brand-accent/5 via-amber-500/3 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Main card composition - borderless layout blending into ambient background */}
      <div className="relative z-10 max-w-xl w-full flex flex-col items-center gap-8 py-8 px-4">
        {/* Lost chess piece icon */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-full bg-brand-accent/5 border border-brand-accent/10 text-brand-accent flex items-center justify-center"
        >
          <HelpCircle className="w-8 h-8" />
        </motion.div>

        {/* 404 Heading Section */}
        <div className="flex flex-col items-center -mt-10">
          <h1 className="text-8xl md:text-9xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-[#f0eae1] to-[#aba499] tracking-tighter leading-none filter">
            404
          </h1>
          <span className="text-xs md:text-sm font-mono text-brand-accent uppercase tracking-widest font-semibold mt-4">
            Page Not Found
          </span>
        </div>

        {/* Informative description */}
        <p className="text-base sm:text-lg text-brand-secondary font-sans leading-relaxed max-w-md">
          The page you are looking for does not exist, or has been moved to a
          new destination.
        </p>

        {/* ── SMART SUGGESTION BOX ── */}
        {suggestion && (
          <div
            onClick={() => navigate(suggestion)}
            className="w-full max-w-md p-4 rounded-xl bg-brand-accent/5 hover:bg-brand-accent/10 border border-brand-accent/10 hover:border-brand-accent/30 cursor-pointer group flex items-center gap-3 transition-all duration-300 active:scale-[0.99] select-none text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
              <Compass className="w-4 h-4 text-brand-accent animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-mono text-brand-secondary uppercase tracking-wider">
                Suggested Route
              </span>
              <span className="text-xs sm:text-sm font-sans font-bold text-brand-accent group-hover:text-brand-text transition-colors truncate block">
                Did you mean {suggestion}?
              </span>
            </div>
            <div className="text-brand-accent group-hover:translate-x-1 transition-all duration-200">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Action Button & Quicklinks */}
        <div className="w-full max-w-sm flex flex-col items-center gap-6 mt-2">
          <button
            onClick={() => navigate("/")}
            className="w-full btn-premium-cta btn-glow-container cta-shine px-6 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>

          {/* Quicklinks */}
          <div className="flex items-center justify-center gap-4 text-xs font-sans text-brand-secondary mt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-border/60">
              Quick Links:
            </span>
            <button
              onClick={() => navigate("/puzzles")}
              className="hover:text-brand-accent hover:underline transition-colors cursor-pointer"
            >
              Puzzles
            </button>
            <span className="text-brand-border/20 select-none">|</span>
            <button
              onClick={() => navigate("/pricing")}
              className="hover:text-brand-accent hover:underline transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
