import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  Trophy,
  ArrowRight,
  Info,
  AlertCircle,
  Star,
  Zap,
  Crown,
  Users,
  Clock,
  Puzzle,
  GraduationCap,
  Bot,
  UserCircle,
  Ban,
  MessageSquare,
  BarChart2,
  BookMarked,
  X
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useNavigationStack } from "../hooks/useNavigationStack";
import { MembershipFeaturesSection } from "../components/pricing/MembershipFeaturesSection";

// ─── Decorative floating chess pieces ────────────────────────────────────────
const PieceSvg: React.FC<{
  type: "king" | "queen" | "rook" | "knight" | "bishop";
}> = ({ type }) => {
  const cls =
    "w-full h-full fill-brand-accent/10 stroke-brand-accent/20 stroke-[0.8] drop-shadow-[0_0_15px_rgba(212,175,110,0.1)]";
  switch (type) {
    case "king":
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <path d="M48 8h4v14h-4z" />
          <path d="M44 12h12v4H44z" />
          <path d="M50 22c14 0 20 8 20 22 0 14-8 20-12 24H42c-4-4-12-10-12-24 0-14 6-22 20-22z" />
          <path d="M30 72h40v8H30z" />
          <path d="M24 80h52v8H24z" />
        </svg>
      );
    case "queen":
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <path d="M50 16a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm22 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-44 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
          <path d="M25 32l8 16 17-21 17 21 8-16 5 36H20l5-36z" />
          <path d="M28 72h44v8H28z" />
          <path d="M22 80h56v8H22z" />
        </svg>
      );
    case "rook":
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <path d="M27 18h10v10h8V18h10v10h8V18h10v21H27V18z" />
          <path d="M35 39h30l-4 34H39L35 39z" />
          <path d="M30 73h40v8H30z" />
          <path d="M24 81h52v8H24z" />
        </svg>
      );
    case "knight":
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <path d="M61 12c15 7 24 22 24 40 0 10-4 20-10 28H40c2-11 8-20 18-27-9 0-17-4-24-11l5-16c6 4 12 6 18 6-4-4-6-9-6-15l10-5z" />
          <path d="M42 80h38v8H42z" />
          <path d="M34 88h52v7H34z" />
          <circle cx="58" cy="31" r="3" fill="rgba(8,11,20,0.3)" />
        </svg>
      );
    case "bishop":
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <path d="M50 10c5 0 9 4 9 9 0 4-2 7-5 8 13 9 21 24 21 39 0 10-10 13-25 13S25 76 25 66c0-15 8-30 21-39-3-1-5-4-5-8 0-5 4-9 9-9z" />
          <path d="M31 79h38v8H31z" />
          <path d="M24 87h52v7H24z" />
        </svg>
      );
    default:
      return null;
  }
};

// ─── Existing Diamond features ────────────────────────────────────────────────
const DIAMOND_FEATURES = [
  "Unlimited Engine Analysis",
  "Unlimited Game Reviews",
  "Advanced Opening Explorer",
  "Deep Position Evaluation",
  "Unlimited Puzzle Training",
  "Performance Insights",
  "Accuracy Reports",
  "Premium Themes",
  "Early Access Features",
  "Priority Support",
  "No Ads",
];

// ─── Plan definitions ─────────────────────────────────────────────────────────
interface PlanDef {
  id: string;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  /** Tailwind text color */
  accentText: string;
  /** Tailwind border color */
  accentBorder: string;
  /** Tailwind bg color for icon well */
  accentBg: string;
  /** rgba for box-shadow glow */
  glowRgba: string;
  monthlyPrice: string;
  yearlyPrice: string | null;
  features: Array<{ label: string; value: string | boolean }>;
  comingSoonMonthly?: boolean;
  comingSoonYearly?: boolean;
  isHighlighted?: boolean;
}

const PLANS: PlanDef[] = [
  {
    id: "gold",
    name: "Gold",
    tagline: "Great for learning the game",
    icon: <Star className="w-4 h-4" />,
    accentText: "text-yellow-400",
    accentBorder: "border-yellow-500/25",
    accentBg: "bg-yellow-500/8",
    glowRgba: "rgba(234,179,8,0.06)",
    monthlyPrice: "$2.49",
    yearlyPrice: "$1.99",
    comingSoonMonthly: true,
    comingSoonYearly: true,
    features: [
      { label: "Online Games", value: "Unlimited" },
      { label: "Engine Analysis", value: "Basic" },
      { label: "Game Reviews", value: "5 / month" },
      { label: "Puzzle Training", value: "50 / day" },
      { label: "Opening Explorer", value: "Limited" },
      { label: "Premium Themes", value: "Basic" },
      { label: "Ad Free", value: true },
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    tagline: "For the ambitious competitor",
    icon: <Zap className="w-4 h-4" />,
    accentText: "text-slate-300",
    accentBorder: "border-slate-400/25",
    accentBg: "bg-slate-400/8",
    glowRgba: "rgba(148,163,184,0.06)",
    monthlyPrice: "$4.99",
    yearlyPrice: "$3.99",
    comingSoonMonthly: true,
    comingSoonYearly: true,
    features: [
      { label: "Online Games", value: "Unlimited" },
      { label: "Engine Analysis", value: "Advanced" },
      { label: "Game Reviews", value: "25 / month" },
      { label: "Puzzle Training", value: "Unlimited" },
      { label: "Opening Explorer", value: "Advanced" },
      { label: "Premium Themes", value: true },
      { label: "Ad Free", value: true },
    ],
  },
  {
    id: "diamond",
    name: "Diamond",
    tagline: "The ultimate chess experience",
    icon: <Crown className="w-4 h-4" />,
    // ── Sky / light-blue accent for Diamond ──
    accentText: "text-sky-300",
    accentBorder: "border-sky-300/40",
    accentBg: "bg-sky-300/12",
    glowRgba: "rgba(125,211,252,0.10)",
    // ── EXISTING PRICE ──
    monthlyPrice: "$5.00",
    yearlyPrice: null,
    comingSoonMonthly: false,
    comingSoonYearly: true,
    isHighlighted: true,
    features: DIAMOND_FEATURES.map((f) => ({ label: f, value: true })),
  },
  {
    id: "family",
    name: "Friends & Family",
    tagline: "Share with those you love",
    icon: <Users className="w-4 h-4" />,
    accentText: "text-emerald-400",
    accentBorder: "border-emerald-500/25",
    accentBg: "bg-emerald-500/8",
    glowRgba: "rgba(16,185,129,0.06)",
    monthlyPrice: "$12.49",
    yearlyPrice: "$9.99",
    comingSoonMonthly: true,
    comingSoonYearly: true,
    features: [
      { label: "Online Games", value: "Unlimited" },
      { label: "Engine Analysis", value: "Unlimited Deep Stockfish" },
      { label: "Game Reviews", value: "Unlimited" },
      { label: "Puzzle Training", value: "Unlimited" },
      { label: "Opening Explorer", value: "Advanced" },
      { label: "Premium Themes", value: true },
      { label: "Accounts Included", value: "Up to 5" },
    ],
  },
];

// ─── Comparison table rows ────────────────────────────────────────────────────
const COMPARISON_ROWS = [
  { label: "Puzzles", icon: <Puzzle className="w-5 h-5 text-orange-500 fill-orange-500" />, gold: true, platinum: true, diamond: true, family: true },
  { label: "Lessons", icon: <GraduationCap className="w-5 h-5 text-sky-400 fill-sky-400" />, gold: true, platinum: true, diamond: true, family: true },
  { label: "Bots", icon: <Bot className="w-5 h-5 text-slate-300 fill-slate-300" />, gold: true, platinum: true, diamond: true, family: true },
  { label: "Play Coach", icon: <UserCircle className="w-5 h-5 text-amber-500 fill-amber-500" />, gold: true, platinum: true, diamond: true, family: true },
  { label: "No Ads", icon: <Ban className="w-5 h-5 text-red-500" />, gold: true, platinum: true, diamond: true, family: true },
  { label: "Game Review", icon: <Star className="w-5 h-5 text-green-500 fill-green-500" />, gold: false, platinum: true, diamond: true, family: true },
  { label: "Move Explanations", icon: <MessageSquare className="w-5 h-5 text-emerald-400 fill-emerald-400" />, gold: false, platinum: false, diamond: true, family: true },
  { label: "Advanced Stats", icon: <BarChart2 className="w-5 h-5 text-blue-500 fill-blue-500" />, gold: false, platinum: false, diamond: true, family: true },
  { label: "Courses Perks", icon: <BookMarked className="w-5 h-5 text-orange-400 fill-orange-400" />, gold: false, platinum: false, diamond: true, family: true },
];

function CompCell({
  value,
  diamond,
}: {
  value: boolean;
  diamond?: boolean;
}) {
  if (value) {
    if (diamond) {
      return (
        <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-sky-500 text-white shadow-md">
          <Check className="w-3.5 h-3.5 stroke-[3.5]" />
        </span>
      );
    }
    return <Check className="w-5 h-5 text-white/90 mx-auto stroke-[3]" />;
  }
  return <X className="w-5 h-5 text-brand-secondary/30 mx-auto stroke-[3]" />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getPrevious } = useNavigationStack();
  const [isYearly, setIsYearly] = useState(false);

  const [showSessionError, setShowSessionError] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("error") === "payment_expired";
  });

  const handleNavigateBack = () => {
    const previousPage = getPrevious();

    if (previousPage) {
      navigate(previousPage.path);
      return;
    }

    navigate("/");
  };

  const handleUpgrade = (planType: "Monthly" | "Yearly") => {
    navigate(`/payment?plan=${planType.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative overflow-hidden select-none pb-16 sm:pb-24">
      {/* ── Background glows ── */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[1200px] h-[500px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10vw] w-[40vw] h-[40vw] bg-sky-300/4 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ── Floating chess pieces ── */}
      <div className="absolute top-[20%] left-[8%] w-24 h-24 pointer-events-none opacity-40 md:block hidden z-0">
        <motion.div
          animate={{ y: [0, -18, 0], rotate: [5, -5, 5] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <PieceSvg type="bishop" />
        </motion.div>
      </div>
      <div className="absolute top-[15%] right-[10%] w-28 h-28 pointer-events-none opacity-30 md:block hidden z-0">
        <motion.div
          animate={{ y: [0, 22, 0], rotate: [-10, 8, -10] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <PieceSvg type="queen" />
        </motion.div>
      </div>
      <div className="absolute bottom-[35%] left-[5%] w-28 h-28 pointer-events-none opacity-30 md:block hidden z-0">
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [-8, 8, -8] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <PieceSvg type="king" />
        </motion.div>
      </div>
      <div className="absolute bottom-[10%] right-[8%] w-24 h-24 pointer-events-none opacity-40 md:block hidden z-0">
        <motion.div
          animate={{ y: [0, -16, 0], rotate: [4, -12, 4] }}
          transition={{
            duration: 7.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        >
          <PieceSvg type="knight" />
        </motion.div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col items-center w-full pt-8">
        {/* ── Back ── */}
        <div className="w-full flex justify-start mb-6">
          <button
            onClick={handleNavigateBack}
            className="flex items-center gap-2.5 text-xs sm:text-sm text-brand-secondary hover:text-brand-text transition-all duration-300 cursor-pointer uppercase tracking-wider font-mono font-medium"
          >
            <span className="w-5 h-5 rounded-full border border-brand-border flex items-center justify-center font-bold text-[9px] hover:border-brand-accent/50">
              &lt;
            </span>
            Back to {getPrevious()?.label ?? "Home"}
          </button>
        </div>

        {/* ── Session error ── */}
        {showSessionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mt-2 mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-sans flex items-center justify-between gap-3 shadow-md z-30"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                Your payment session has expired or no completed purchase was
                found.
              </span>
            </div>
            <button
              onClick={() => {
                setShowSessionError(false);
                navigate(location.pathname, { replace: true });
              }}
              className="text-amber-400 hover:text-brand-text font-mono text-xs uppercase font-bold cursor-pointer flex-shrink-0"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* ── HERO ── */}
        <section className="text-center pt-16 sm:pt-20 pb-12 sm:pb-16 max-w-3xl flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-surface/80 border border-brand-border backdrop-blur-sm text-brand-accent text-xs font-sans tracking-wide mb-6 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trusted by thousands of chess players</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-medium tracking-tight text-brand-text mb-6 leading-[1.05]"
          >
            Unlock Your Full <br className="sm:block hidden" />
            <span className="text-gold-gradient font-bold italic">
              Chess Potential
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-brand-secondary font-sans leading-relaxed max-w-2xl px-2"
          >
            Choose the plan that fits your ambitions — from casual learner to
            elite competitor.
          </motion.p>
        </section>

        {/* ── BILLING TOGGLE ── */}
        <section className="mb-14 z-20">
          <div className="bg-brand-surface/90 border border-brand-border p-1.5 rounded-2xl flex items-center relative shadow-xl">
            <button
              onClick={() => setIsYearly(false)}
              className={`relative z-10 px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-300 cursor-pointer min-w-[120px] text-center
                ${!isYearly ? "text-brand-bg" : "text-brand-secondary hover:text-brand-text"}`}
            >
              {!isYearly && (
                <motion.div
                  layoutId="billingSlider"
                  className="absolute inset-0 bg-brand-accent rounded-xl -z-10 shadow-lg shadow-brand-accent/20"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              Monthly
            </button>

            <button
              onClick={() => setIsYearly(true)}
              className={`relative z-10 px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-300 cursor-pointer min-w-[120px] text-center
                ${isYearly ? "text-brand-bg" : "text-brand-secondary hover:text-brand-text"}`}
            >
              {isYearly && (
                <motion.div
                  layoutId="billingSlider"
                  className="absolute inset-0 bg-brand-accent rounded-xl -z-10 shadow-lg shadow-brand-accent/20"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              Yearly
            </button>

            <div className="absolute z-20 top-0 left-3/4 -translate-x-1/2 -translate-y-1/2 sm:left-[calc(100%+14px)] sm:top-1/2 sm:translate-x-0 whitespace-nowrap bg-brand-accent/15 border border-brand-accent/30 text-brand-accent text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-md">
              Save up to 40%
            </div>
          </div>
        </section>

        {/* ── PLAN CARDS ── */}
        <section className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-16 z-10 max-w-6xl">
          {PLANS.map((plan, idx) => {
            const comingSoon = isYearly
              ? plan.comingSoonYearly
              : plan.comingSoonMonthly;
            const displayPrice = isYearly
              ? plan.yearlyPrice ?? plan.monthlyPrice
              : plan.monthlyPrice;
            const isDiamond = plan.id === "diamond";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                style={
                  plan.isHighlighted
                    ? { boxShadow: `0 0 50px ${plan.glowRgba}` }
                    : undefined
                }
                className={`relative flex flex-col rounded-2xl border p-5 pt-6 transition-all duration-300 ${
                  plan.isHighlighted
                    ? `bg-gradient-to-b from-brand-surface to-brand-bg ${plan.accentBorder}`
                    : `bg-brand-surface/60 backdrop-blur-sm ${plan.accentBorder}`
                }`}
              >
                {/* Diamond top glow */}
                {plan.isHighlighted && (
                  <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[180px] h-[180px] rounded-full bg-sky-300/12 blur-[55px] pointer-events-none" />
                )}

                {/* Most Popular badge */}
                {plan.isHighlighted && !comingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-400 text-white text-[10px] font-mono tracking-wider uppercase font-bold shadow-lg shadow-sky-300/30">
                    <Trophy className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                {/* Coming Soon pill */}
                {comingSoon && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-text/5 border border-brand-border text-brand-secondary text-[9px] font-mono tracking-wide uppercase">
                    <Clock className="w-2.5 h-2.5" />
                    Soon
                  </div>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className={`w-8 h-8 rounded-lg ${plan.accentBg} border ${plan.accentBorder} flex items-center justify-center ${plan.accentText}`}
                  >
                    {plan.icon}
                  </div>
                  <div>
                    <h3
                      className={`font-display font-semibold text-base tracking-wide ${plan.accentText}`}
                    >
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-brand-secondary leading-none mt-0.5">
                      {plan.tagline}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5 min-h-[64px] flex flex-col justify-center">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-3xl font-display font-bold ${
                        isDiamond && !comingSoon
                          ? "text-sky-300"
                          : comingSoon
                          ? "text-brand-text/35"
                          : "text-brand-text"
                      }`}
                    >
                      {displayPrice}
                    </span>
                    <span className="text-xs text-brand-secondary font-sans">
                      / mo
                    </span>
                  </div>
                  {!comingSoon && isYearly && plan.yearlyPrice && (
                    <span className="text-[11px] font-mono text-emerald-400 mt-0.5">
                      billed annually
                    </span>
                  )}
                  {comingSoon && (
                    <span className="text-[11px] font-mono text-brand-secondary/40 mt-0.5">
                      Coming Soon
                    </span>
                  )}
                  {isDiamond && isYearly && !plan.yearlyPrice && (
                    <span className="text-[11px] font-mono text-brand-secondary/40 mt-0.5">
                      Yearly — Coming Soon
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.slice(0, 7).map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2.5">
                      <span
                        className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                          isDiamond && !comingSoon
                            ? "bg-sky-300/15 text-sky-300"
                            : "bg-brand-text/5 text-brand-secondary"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      <span
                        className={`text-xs font-sans leading-relaxed ${
                          comingSoon ? "text-brand-secondary/40" : "text-brand-text"
                        }`}
                      >
                        {typeof feat.value === "string"
                          ? `${feat.label} — ${feat.value}`
                          : feat.label}
                      </span>
                    </li>
                  ))}
                  {plan.features.length > 7 && (
                    <li
                      className={`text-[11px] font-mono pl-6 ${
                        comingSoon
                          ? "text-brand-secondary/30"
                          : "text-brand-secondary/60"
                      }`}
                    >
                      +{plan.features.length - 7} more features
                    </li>
                  )}
                </ul>

                {/* CTA button */}
                <button
                  disabled={!!comingSoon || (isDiamond && isYearly)}
                  onClick={() => {
                    if (!comingSoon && isDiamond && !isYearly) {
                      handleUpgrade("Monthly");
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-mono text-[11px] uppercase tracking-widest font-semibold transition-all duration-300 relative overflow-hidden ${
                    comingSoon || (isDiamond && isYearly)
                      ? "bg-brand-text/5 border border-brand-text/10 text-brand-secondary/30 cursor-not-allowed"
                      : isDiamond
                      ? "bg-sky-500 hover:bg-sky-400 text-white border border-sky-300/50 shadow-lg shadow-sky-300/20 hover:scale-[1.01] cursor-pointer active:scale-[0.99]"
                      : "bg-brand-text/5 border border-brand-border hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text cursor-pointer active:scale-[0.99]"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    {comingSoon || (isDiamond && isYearly) ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        Coming Soon
                      </>
                    ) : isDiamond ? (
                      <>
                        Get Diamond
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      `Get ${plan.name}`
                    )}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section className="w-full max-w-6xl mb-20 sm:mb-24 z-10">
          <div className="w-full overflow-x-auto rounded-2xl border border-brand-border bg-brand-surface/60 backdrop-blur-xl shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[800px]">
              
              {/* ── HEADER ROW ── */}
              <thead>
                <tr>
                  {/* Top Left: Toggle */}
                  <th className="pt-4 pb-12 px-6 align-top w-64 border-b border-brand-border/60">
                    <div className="flex items-center gap-6 text-sm font-semibold text-brand-secondary">
                      <button 
                        onClick={() => setIsYearly(false)} 
                        className={`hover:text-brand-text transition-colors flex items-center gap-1.5 ${!isYearly ? "text-brand-text" : ""}`}
                      >
                        {!isYearly && <Check className="w-4 h-4" />}
                        Monthly
                      </button>
                      <button 
                        onClick={() => setIsYearly(true)} 
                        className={`hover:text-brand-text transition-colors flex items-center gap-1.5 ${isYearly ? "text-brand-text" : ""}`}
                      >
                        {isYearly && <Check className="w-4 h-4" />}
                        Yearly <span className="text-brand-secondary/60 font-normal">(save 44%)</span>
                      </button>
                    </div>
                  </th>

                  {/* UNLIMITED Column Header */}
                  <th className="pt-16 pb-6 px-4 align-bottom text-center w-32 border-b border-brand-border/60 bg-brand-text/[0.02]">
                    <span className="text-xs font-bold text-brand-secondary uppercase tracking-wider">UNLIMITED</span>
                  </th>

                  {/* Gold */}
                  <th className="pt-16 pb-6 px-4 align-bottom text-center w-36 border-b border-brand-border/60 bg-brand-text/[0.02]">
                    <div className="flex items-center justify-center gap-2 text-lg font-bold">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      Gold
                    </div>
                  </th>

                  {/* Platinum */}
                  <th className="pt-16 pb-6 px-4 align-bottom text-center w-36 border-b border-brand-border/60 bg-brand-text/[0.02]">
                    <div className="flex items-center justify-center gap-2 text-lg font-bold">
                      <Crown className="w-5 h-5 text-slate-300 fill-slate-300" />
                      Platinum
                    </div>
                  </th>

                  {/* Diamond */}
                  <th className="relative pt-6 pb-6 px-4 align-bottom text-center w-48 border-t-2 border-l-2 border-r-2 border-sky-400 bg-sky-950/40 rounded-t-2xl shadow-[0_-10px_30px_rgba(56,189,248,0.1)]">
                    {/* Diamond Illustration Placeholder */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-sky-300 to-sky-600 rounded-lg rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)] border-2 border-sky-200">
                       <div className="w-10 h-10 border border-white/30 rounded-sm" />
                    </div>
                    {/* Sparkles */}
                    <Sparkles className="absolute -top-8 left-10 w-4 h-4 text-white" />
                    <Sparkles className="absolute -top-2 right-12 w-3 h-3 text-white" />
                    
                    <div className="text-[10px] font-bold text-sky-400 tracking-widest uppercase mb-1 mt-6">
                      Most Popular
                    </div>
                    <div className="text-xl font-bold text-brand-text">
                      Diamond
                    </div>
                  </th>

                  {/* Family */}
                  <th className="pt-14 pb-6 px-4 align-bottom text-center w-40 border-b border-brand-border/60 bg-brand-text/[0.02]">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mb-1">
                        Save 70%
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-base font-bold whitespace-nowrap">
                        <Users className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                        Friends & Family
                      </div>
                      <div className="mt-1 px-2 py-0.5 rounded bg-brand-text/10 text-[9px] font-bold text-brand-secondary tracking-wider">
                        2-6 MEMBERS
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* ── BODY ROWS ── */}
              <tbody className="divide-y divide-brand-border/30">
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} className="hover:bg-brand-text/[0.015] transition-colors duration-100">
                    {/* Feature Label */}
                    <td className="py-4 px-6 font-semibold text-[15px] flex items-center gap-3 text-brand-text">
                      {row.icon}
                      {row.label}
                      <Info className="w-3.5 h-3.5 text-brand-secondary ml-1 cursor-pointer hover:text-brand-text" />
                    </td>

                    {/* UNLIMITED filler (just background) */}
                    <td className="py-4 px-4 bg-brand-text/[0.02]" />

                    {/* Gold */}
                    <td className="py-4 px-4 text-center">
                      <CompCell value={row.gold} />
                    </td>

                    {/* Platinum */}
                    <td className="py-4 px-4 text-center">
                      <CompCell value={row.platinum} />
                    </td>

                    {/* Diamond (Highlighted) */}
                    <td className="py-4 px-4 text-center border-l-2 border-r-2 border-sky-400 bg-sky-950/40">
                      <CompCell value={row.diamond} diamond />
                    </td>

                    {/* Family */}
                    <td className="py-4 px-4 text-center">
                      <CompCell value={row.family} />
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* ── FOOTER ROW ── */}
              <tfoot>
                <tr className="border-t border-brand-border/60">
                  <td className="py-8 px-6 text-xs text-brand-secondary/60">
                    ^When billed yearly<br/><br/>
                    Prices for all plans include taxes
                  </td>
                  
                  {/* UNLIMITED filler bottom */}
                  <td className="bg-brand-text/[0.02]" />

                  {/* Gold Footer */}
                  <td className="py-8 px-4 text-center bg-brand-text/[0.02]">
                    <button onClick={() => handleUpgrade("Yearly")} className="w-[120px] py-2.5 rounded-lg bg-brand-text/10 hover:bg-brand-text/15 text-brand-text font-semibold text-sm transition-colors mb-2">
                      Choose Plan
                    </button>
                    <div className="text-[10px] text-brand-secondary/60 line-through mb-0.5">NZ$11.99 / Month</div>
                    <div className="text-sm font-bold text-brand-text">NZ$7.09/mo*</div>
                  </td>

                  {/* Platinum Footer */}
                  <td className="py-8 px-4 text-center bg-brand-text/[0.02]">
                    <button onClick={() => handleUpgrade("Yearly")} className="w-[120px] py-2.5 rounded-lg bg-brand-text/10 hover:bg-brand-text/15 text-brand-text font-semibold text-sm transition-colors mb-2">
                      Choose Plan
                    </button>
                    <div className="text-[10px] text-brand-secondary/60 line-through mb-0.5">NZ$17.99 / Month</div>
                    <div className="text-sm font-bold text-brand-text">NZ$10.84/mo*</div>
                  </td>

                  {/* Diamond Footer */}
                  <td className="py-8 px-4 text-center border-b-2 border-l-2 border-r-2 border-sky-400 bg-sky-950/40 rounded-b-2xl shadow-[0_10px_30px_rgba(56,189,248,0.1)]">
                    <button onClick={() => handleUpgrade("Yearly")} className="w-[140px] py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-colors mb-2 shadow-lg shadow-sky-500/20">
                      Get Full Access
                    </button>
                    <div className="text-[10px] text-brand-secondary/60 line-through mb-0.5">NZ$29.99 / Month</div>
                    <div className="text-sm font-bold text-sky-400">NZ$16.67/mo*</div>
                  </td>

                  {/* Family Footer */}
                  <td className="py-8 px-4 text-center bg-brand-text/[0.02]">
                    <button onClick={() => handleUpgrade("Yearly")} className="w-[140px] py-2.5 rounded-lg bg-brand-text/10 hover:bg-brand-text/15 text-brand-text font-semibold text-sm transition-colors mb-2">
                      Get Full Access
                    </button>
                    <div className="text-[10px] text-transparent mb-0.5">-</div>
                    <div className="text-sm font-bold text-brand-text">NZ$29.17/mo*</div>
                  </td>
                </tr>
              </tfoot>
              
            </table>
          </div>
        </section>

        {/* ── Feature Banners ── */}
        <MembershipFeaturesSection />
      </main>
    </div>
  );
}