import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { BackButton } from "@/components/molecules/BackButton";

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

  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[800px] h-[400px] bg-gradient-to-r from-brand-accent/5 via-amber-500/3 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-xl w-full flex flex-col items-center gap-8 py-8 px-4">
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
          <h1 className="coming-soon-heading text-4xl md:text-5xl font-display font-extrabold tracking-tight leading-tight">
            {featureName}
          </h1>
        </div>

        {/* Description */}
        <p className="text-sm md:text-base text-brand-secondary font-sans leading-relaxed max-w-md">
          {description}
        </p>

        {/* Decorative divider */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-brand-accent/30 to-transparent" />

        {/* Go Back button */}
        <BackButton label="Go Back" className="px-6 py-3 rounded-xl border border-brand-border/60 hover:border-brand-accent/40 hover:bg-brand-text/5" />
      </div>
    </div>
  );
}
