import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, FileText } from "lucide-react";

interface ComingSoonPageProps {
  featureName: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function ComingSoonPage({
  featureName,
  description,
  icon: Icon = FileText,
}: ComingSoonPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[800px] h-[400px] bg-gradient-to-r from-brand-accent/5 via-amber-500/3 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-xl w-full flex flex-col items-center gap-8 py-8 px-4"
      >
        {/* Feature icon */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="coming-soon-icon w-16 h-16 rounded-full bg-brand-accent/5 border border-brand-accent/10 text-brand-accent flex items-center justify-center"
        >
          <Icon className="w-8 h-8" />
        </motion.div>

        {/* Heading */}
        <div className="flex flex-col items-center gap-3 -mt-4">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="coming-soon-heading text-4xl md:text-5xl font-display font-extrabold tracking-tight leading-tight"
          >
            {featureName}
          </motion.h1>

          {/* Coming Soon badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-accent/30 bg-brand-accent/5"
          >
            <Clock className="w-3 h-3 text-brand-accent" />
            <span className="text-xs font-mono text-brand-accent uppercase tracking-widest font-semibold">
              Coming Soon
            </span>
          </motion.div>
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm md:text-base text-brand-secondary font-sans leading-relaxed max-w-md"
        >
          {description}
        </motion.p>

        {/* Decorative divider */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-brand-accent/30 to-transparent" />

        {/* Go Back button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-brand-border/60 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 hover:bg-brand-text/5 transition-all duration-200 text-sm font-sans font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </motion.button>
      </motion.div>
    </div>
  );
}
