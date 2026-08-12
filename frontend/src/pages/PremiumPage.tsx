import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Crown, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function PremiumPage() {
  const { isPro, loading, error } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col justify-center items-center p-4">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="mt-4 font-sans text-brand-secondary text-sm">Verifying subscription...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[55vh] flex flex-col justify-center items-center p-4">
        <p className="font-sans text-red-500 text-sm">Failed to verify subscription. Please try again later.</p>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none relative overflow-hidden">
        <div className="relative z-10 max-w-xl w-full flex flex-col items-center gap-8 py-10 px-6 rounded-2xl">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-brand-accent/5 border border-brand-accent/10 text-brand-accent flex items-center justify-center"
          >
            <Crown className="w-8 h-8" />
          </motion.div>

          <div className="flex flex-col items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-brand-text via-brand-text/90 to-brand-secondary tracking-tight">
              Premium Exclusive
            </h1>
            <p className="text-base sm:text-lg text-brand-secondary font-sans leading-relaxed max-w-md">
              This section is reserved for Premium members. Unlock advanced features, personalized analytics, and exclusive content.
            </p>
          </div>

          <button
            onClick={() => navigate("/pricing")}
            className="w-full sm:w-auto btn-premium-cta btn-glow-container cta-shine px-8 py-3.5 rounded-xl font-mono text-sm uppercase tracking-widest font-semibold flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade to Premium</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    );
  }

  // Render Premium Content
  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center gap-8 py-12 px-4 max-w-2xl">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-brand-accent/20 rounded-full blur-2xl animate-pulse" />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border border-brand-accent/20 text-brand-accent flex items-center justify-center transform rotate-3 relative z-10">
            <Crown className="w-10 h-10" />
          </div>
        </motion.div>

        <div className="flex flex-col items-center gap-4">
          <div>
            <span className="text-xs md:text-sm font-mono text-brand-accent uppercase tracking-widest font-semibold flex items-center gap-2 justify-center mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Pro Member Access
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-brand-text via-brand-text/90 to-brand-secondary tracking-tighter leading-tight">
              Premium Features<br />Coming Soon
            </h1>
          </div>

          <p className="text-base sm:text-lg text-brand-secondary font-sans leading-relaxed max-w-lg mt-2">
            We are crafting an exclusive experience for our premium members. Expect advanced board analysis, custom themes, and unparalleled chess tools shortly.
          </p>
        </div>
      </div>
    </div>
  );
}