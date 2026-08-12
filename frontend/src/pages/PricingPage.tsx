import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Info,
  AlertCircle,
  Star,
  Crown,
  Users,
  Puzzle,
  GraduationCap,
  Bot,
  UserCircle,
  Ban,
  MessageSquare,
  BarChart2,
  BookMarked,
  X,
} from "lucide-react";
import { usePricing } from "@/hooks/usePricing";
import type { PricingResponse } from "@/services/pricingApi";
import { useNavigate, useLocation } from "react-router";
import { useNavigationStack } from "@/hooks/useNavigationStack";
import { MembershipFeaturesSection } from "@/components/pricing/MembershipFeaturesSection";

// ─── Decorative floating chess pieces ──────────────────────────────────────────
const PieceSvg: React.FC<{
  type: "king" | "queen" | "rook" | "knight" | "bishop";
}> = ({ type }) => {
  const cls =
    "w-full h-full fill-brand-accent/10 stroke-brand-accent/20 stroke-[0.8]";
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

type PlanKey = "gold" | "platinum" | "diamond" | "family";

interface ComparisonRow {
  label: string;
  icon: React.ReactNode;
  gold: boolean;
  platinum: boolean;
  diamond: boolean;
  family: boolean;
}

// ─── Comparison table rows ─────────────────────────────────────────────────────
const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Puzzles",
    icon: (
      <Puzzle className="w-5 h-5 text-orange-500 fill-orange-500 flex-shrink-0" />
    ),
    gold: true,
    platinum: true,
    diamond: true,
    family: true,
  },
  {
    label: "Lessons",
    icon: (
      <GraduationCap className="w-5 h-5 text-sky-400 fill-sky-400 flex-shrink-0" />
    ),
    gold: true,
    platinum: true,
    diamond: true,
    family: true,
  },
  {
    label: "Bots",
    icon: (
      <Bot className="w-5 h-5 text-slate-400 fill-slate-400 flex-shrink-0" />
    ),
    gold: true,
    platinum: true,
    diamond: true,
    family: true,
  },
  {
    label: "Play Coach",
    icon: (
      <UserCircle className="w-5 h-5 text-amber-500 fill-amber-500 flex-shrink-0" />
    ),
    gold: true,
    platinum: true,
    diamond: true,
    family: true,
  },
  {
    label: "No Ads",
    icon: <Ban className="w-5 h-5 text-red-500 flex-shrink-0" />,
    gold: true,
    platinum: true,
    diamond: true,
    family: true,
  },
  {
    label: "Game Review",
    icon: (
      <Star className="w-5 h-5 text-green-500 fill-green-500 flex-shrink-0" />
    ),
    gold: false,
    platinum: true,
    diamond: true,
    family: true,
  },
  {
    label: "Move Explanations",
    icon: (
      <MessageSquare className="w-5 h-5 text-emerald-400 fill-emerald-400 flex-shrink-0" />
    ),
    gold: false,
    platinum: false,
    diamond: true,
    family: true,
  },
  {
    label: "Advanced Stats",
    icon: (
      <BarChart2 className="w-5 h-5 text-blue-500 fill-blue-500 flex-shrink-0" />
    ),
    gold: false,
    platinum: false,
    diamond: true,
    family: true,
  },
  {
    label: "Courses Perks",
    icon: (
      <BookMarked className="w-5 h-5 text-orange-400 fill-orange-400 flex-shrink-0" />
    ),
    gold: false,
    platinum: false,
    diamond: true,
    family: true,
  },
];

// Mobile plan definitions
const MOBILE_PLANS: Array<{
  id: string;
  key: PlanKey;
  name: string;
  badge?: string;
  icon: React.ReactNode;
}> = [
  {
    id: "gold",
    key: "gold",
    name: "Gold",
    icon: (
      <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 flex-shrink-0" />
    ),
  },
  {
    id: "platinum",
    key: "platinum",
    name: "Platinum",
    icon: (
      <Crown className="w-6 h-6 text-slate-300 fill-slate-300 flex-shrink-0" />
    ),
  },
  {
    id: "diamond",
    key: "diamond",
    name: "Diamond",
    icon: <Sparkles className="w-6 h-6 text-sky-400 flex-shrink-0" />,
  },
  {
    id: "family",
    key: "family",
    name: "Friends & Family",
    badge: "Save 70%",
    icon: (
      <Users className="w-6 h-6 text-emerald-400 fill-emerald-400 flex-shrink-0" />
    ),
  },
];

// ─── USD base prices for all tiers (ground truth) ─────────────────────────────
const USD_PRICES: Record<string, { monthly: number; yearly: number }> = {
  gold: { monthly: 2.08, yearly: 8.5 },
  platinum: { monthly: 3.33, yearly: 13.6 },
  diamond: { monthly: 5.0, yearly: 20.4 },
  family: { monthly: 15.0, yearly: 61.2 },
};

const DIAMOND_USD_MONTHLY = 5.0;
const DIAMOND_USD_YEARLY = 20.4;

function formatConvertedPrice(amount: number): string {
  if (amount >= 100) return Math.round(amount).toString();
  return amount.toFixed(2);
}

function getDynamicPlanPrice(
  planId: string,
  isYearly: boolean,
  pricing: PricingResponse,
): string {
  const usdPrices = USD_PRICES[planId];
  if (!usdPrices) return `${pricing.symbol}0`;

  const rate = isYearly
    ? pricing.yearly / DIAMOND_USD_YEARLY
    : pricing.monthly / DIAMOND_USD_MONTHLY;

  const usdPerMonth = isYearly ? usdPrices.yearly / 12 : usdPrices.monthly;

  const localPrice = Math.max(0.01, usdPerMonth * rate);
  return `${pricing.symbol}${formatConvertedPrice(localPrice)}`;
}

function getDynamicYearlyTotal(
  planId: string,
  pricing: PricingResponse,
): string {
  const usdPrices = USD_PRICES[planId];
  if (!usdPrices) return "";

  const rate = pricing.yearly / DIAMOND_USD_YEARLY;
  const localYearlyTotal = usdPrices.yearly * rate;
  return `${pricing.symbol}${formatConvertedPrice(localYearlyTotal)}`;
}

// ─── Comparison cell helper ────────────────────────────────────────────────────
function CompCell({ value, diamond }: { value: boolean; diamond?: boolean }) {
  if (value) {
    if (diamond) {
      return (
        <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-sky-500 text-white">
          <Check className="w-3.5 h-3.5 stroke-[3.5]" />
        </span>
      );
    }
    return (
      <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mx-auto stroke-[3]" />
    );
  }
  return <X className="w-5 h-5 text-brand-secondary/30 mx-auto stroke-[3]" />;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getPrevious } = useNavigationStack();
  const [isYearly, setIsYearly] = useState(false);

  const { pricing } = usePricing();

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
    const billing = planType.toLowerCase();
    const params = new URLSearchParams();
    params.set("plan", billing);
    const currentParams = new URLSearchParams(location.search);
    const countryOverride =
      currentParams.get("country") || pricing?.countryCode;
    if (countryOverride) {
      params.set("country", countryOverride);
    }
    navigate(`/payment?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative overflow-hidden select-none pb-16 sm:pb-24">
      {/* ─── Background glows ─── */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[1200px] h-[500px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10vw] w-[40vw] h-[40vw] bg-sky-300/4 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ─── Floating chess pieces ─── */}
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
        {/* ─── Back ─── */}
        <div className="w-full flex justify-start mb-6">
          <button
            onClick={handleNavigateBack}
            className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to {getPrevious()?.label ?? "Home"}</span>
          </button>
        </div>

        {/* ─── Session error ─── */}
        {showSessionError && (
          <div className="w-full max-w-2xl mt-2 mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-sans flex items-center justify-between gap-3 z-30">
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
          </div>
        )}

        {/* ─── HERO ─── */}
        <section className="text-center pt-16 sm:pt-20 pb-12 sm:pb-16 max-w-3xl flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-surface/80 border border-brand-border backdrop-blur-sm text-brand-accent text-xs font-sans tracking-wide mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trusted by thousands of chess players</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium tracking-tight text-brand-text mb-6 leading-[1.05]">
            Unlock Your Full <br className="sm:block hidden" />
            <span className="text-gold-gradient font-bold italic">
              Chess Potential
            </span>
          </h1>

          <p className="text-base sm:text-lg text-brand-secondary font-sans leading-relaxed max-w-2xl px-2">
            Choose the plan that fits your ambitions, from casual learner to
            elite competitor.
          </p>
        </section>

        {/* ─── BILLING TOGGLE ─── */}
        <section className="mb-14 z-20">
          <div className="bg-brand-surface/90 border border-brand-border p-1.5 rounded-2xl flex items-center relative">
            <button
              onClick={() => setIsYearly(false)}
              className={`relative z-10 px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-300 cursor-pointer min-w-[120px] text-center
                ${!isYearly ? "text-brand-bg" : "text-brand-secondary hover:text-brand-text"}`}
            >
              {!isYearly && (
                <motion.div
                  layoutId="billingSlider"
                  className="absolute inset-0 bg-brand-accent rounded-xl -z-10"
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
                  className="absolute inset-0 bg-brand-accent rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              Yearly
            </button>

            <div className="absolute z-20 -top-6 left-3/4 -translate-x-1/2 sm:left-[calc(100%+14px)] sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0 whitespace-nowrap bg-brand-accent/15 border border-brand-accent/30 text-brand-accent text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-md pointer-events-none">
              Save up to 66%
            </div>
          </div>
        </section>

        {/* ─── MOBILE PLAN CARDS (Visible only on mobile/tablet < md) ─── */}
        <div className="w-full max-w-md mx-auto flex flex-col gap-6 md:hidden mb-16 z-10 px-2">
          {MOBILE_PLANS.map((plan) => {
            const isDiamond = plan.id === "diamond";
            const priceStr = getDynamicPlanPrice(plan.id, isYearly, pricing);
            const yearlyTotalStr = getDynamicYearlyTotal(plan.id, pricing);
            const tickedFeatures = COMPARISON_ROWS.filter((r) => r[plan.key]);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 backdrop-blur-xl transition-all ${
                  isDiamond
                    ? "bg-brand-surface/90 border-2 border-sky-400"
                    : "bg-brand-surface/60 border border-brand-border"
                }`}
              >
                {isDiamond && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                {/* Card Header */}
                <div className="flex items-center justify-between mb-4 mt-1">
                  <div className="flex items-center gap-2.5">
                    {plan.icon}
                    <h3 className="text-xl font-bold text-brand-text">
                      {plan.name}
                    </h3>
                  </div>
                  {plan.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {plan.badge}
                    </span>
                  )}
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-3xl font-bold ${
                        isDiamond ? "text-sky-400" : "text-brand-text"
                      }`}
                    >
                      {priceStr}
                    </span>
                    <span className="text-xs text-brand-secondary">/month</span>
                  </div>
                  {isYearly && yearlyTotalStr && (
                    <div className="text-xs text-brand-secondary/70 mt-1">
                      Billed as {yearlyTotalStr}/yr
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                {isDiamond ? (
                  <button
                    onClick={() =>
                      handleUpgrade(isYearly ? "Yearly" : "Monthly")
                    }
                    className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all mb-6 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <span>Get Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-brand-text/5 border border-brand-border text-brand-secondary opacity-40 font-mono text-xs uppercase tracking-wider font-semibold cursor-not-allowed mb-6"
                  >
                    Soon
                  </button>
                )}

                {/* Ticked Features Only */}
                <div className="border-t border-brand-border/40 pt-4">
                  <div className="text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-3">
                    Included Features
                  </div>
                  <div className="flex flex-col gap-3">
                    {tickedFeatures.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm text-brand-text"
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 flex-shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                        <span className="flex items-center gap-2.5 font-medium">
                          {feat.icon}
                          {feat.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── DESKTOP COMPARISON TABLE (Visible >= md) ─── */}
        <section className="w-full max-w-6xl mb-20 sm:mb-24 z-10 hidden md:block">
          <div className="w-full overflow-x-auto rounded-2xl border border-brand-border bg-brand-surface/60 backdrop-blur-xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              {/* ─── HEADER ROW ─── */}
              <thead>
                <tr>
                  {/* Top Left Cell (0,0): Perfectly Aligned Toggle */}
                  <th className="pb-6 pt-12 px-6 align-bottom w-64 border-b border-brand-border/60">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-brand-secondary">
                      <button
                        onClick={() => setIsYearly(false)}
                        className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                          !isYearly
                            ? "bg-brand-accent/15 border-brand-accent text-brand-accent font-bold"
                            : "border-brand-border hover:border-brand-secondary/40 text-brand-secondary hover:text-brand-text"
                        }`}
                      >
                        {!isYearly && <Check className="w-3.5 h-3.5" />}
                        Monthly
                      </button>
                      <button
                        onClick={() => setIsYearly(true)}
                        className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isYearly
                            ? "bg-brand-accent/15 border-brand-accent text-brand-accent font-bold"
                            : "border-brand-border hover:border-brand-secondary/40 text-brand-secondary hover:text-brand-text"
                        }`}
                      >
                        {isYearly && <Check className="w-3.5 h-3.5" />}
                        Yearly
                      </button>
                    </div>
                  </th>

                  {/* Gold */}
                  <th className="pt-16 pb-6 px-4 align-bottom text-center w-36 border-b border-brand-border/60">
                    <div className="flex items-center justify-center gap-2 text-lg font-bold">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      Gold
                    </div>
                  </th>

                  {/* Platinum */}
                  <th className="pt-16 pb-6 px-4 align-bottom text-center w-36 border-b border-brand-border/60">
                    <div className="flex items-center justify-center gap-2 text-lg font-bold">
                      <Crown className="w-5 h-5 text-slate-300 fill-slate-300" />
                      Platinum
                    </div>
                  </th>

                  {/* Diamond */}
                  <th className="relative pt-12 pb-6 px-4 align-bottom text-center w-48 border-t-2 border-l-2 border-r-2 border-sky-400 bg-sky-500/[0.04] rounded-t-2xl">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 tracking-widest uppercase mb-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/30">
                        <Sparkles className="w-3 h-3 text-sky-400" />
                        Most Popular
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xl font-bold text-brand-text">
                        <Crown className="w-5 h-5 text-sky-400 fill-sky-400" />
                        Diamond
                      </div>
                    </div>
                  </th>

                  {/* Family */}
                  <th className="pt-14 pb-6 px-4 align-bottom text-center w-40 border-b border-brand-border/60">
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

              {/* ─── BODY ROWS ─── */}
              <tbody className="divide-y divide-brand-border/30">
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-brand-text/[0.015] transition-colors duration-100"
                  >
                    {/* Feature Label */}
                    <td className="py-4 px-6 font-semibold text-[15px] flex items-center gap-3 text-brand-text">
                      {row.icon}
                      {row.label}
                      <Info className="w-3.5 h-3.5 text-brand-secondary ml-1 cursor-pointer hover:text-brand-text" />
                    </td>

                    {/* Gold */}
                    <td className="py-4 px-4 text-center">
                      <CompCell value={row.gold} />
                    </td>

                    {/* Platinum */}
                    <td className="py-4 px-4 text-center">
                      <CompCell value={row.platinum} />
                    </td>

                    {/* Diamond (Highlighted, clean sky accent without gray overlay) */}
                    <td className="py-4 px-4 text-center border-l-2 border-r-2 border-sky-400 bg-sky-500/[0.03]">
                      <CompCell value={row.diamond} diamond />
                    </td>

                    {/* Family */}
                    <td className="py-4 px-4 text-center">
                      <CompCell value={row.family} />
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* ─── FOOTER ROW ─── */}
              <tfoot>
                <tr className="border-t border-brand-border/60">
                  <td className="py-8 px-6 text-xs text-brand-secondary/60">
                    *When billed yearly
                    <br />
                    <br />
                    Prices for all plans include taxes
                  </td>

                  {/* Gold Footer */}
                  <td className="py-8 px-4 text-center">
                    <button
                      disabled
                      className="w-[120px] py-2.5 rounded-lg bg-brand-text/5 border border-brand-border text-brand-secondary opacity-40 font-semibold text-xs transition-colors mb-2 cursor-not-allowed uppercase font-mono tracking-wider"
                    >
                      Soon
                    </button>
                    <div className="text-sm font-bold text-brand-text">
                      {getDynamicPlanPrice("gold", isYearly, pricing)}
                      <span className="text-xs font-normal text-brand-secondary">
                        /mo
                      </span>
                    </div>
                    {isYearly && (
                      <div className="text-[10px] text-brand-secondary/60 mt-0.5">
                        Billed as {getDynamicYearlyTotal("gold", pricing)}/yr
                      </div>
                    )}
                  </td>

                  {/* Platinum Footer */}
                  <td className="py-8 px-4 text-center">
                    <button
                      disabled
                      className="w-[120px] py-2.5 rounded-lg bg-brand-text/5 border border-brand-border text-brand-secondary opacity-40 font-semibold text-xs transition-colors mb-2 cursor-not-allowed uppercase font-mono tracking-wider"
                    >
                      Soon
                    </button>
                    <div className="text-sm font-bold text-brand-text">
                      {getDynamicPlanPrice("platinum", isYearly, pricing)}
                      <span className="text-xs font-normal text-brand-secondary">
                        /mo
                      </span>
                    </div>
                    {isYearly && (
                      <div className="text-[10px] text-brand-secondary/60 mt-0.5">
                        Billed as {getDynamicYearlyTotal("platinum", pricing)}
                        /yr
                      </div>
                    )}
                  </td>

                  {/* Diamond Footer */}
                  <td className="py-8 px-4 text-center border-b-2 border-l-2 border-r-2 border-sky-400 bg-sky-500/[0.04] rounded-b-2xl">
                    <button
                      onClick={() =>
                        handleUpgrade(isYearly ? "Yearly" : "Monthly")
                      }
                      className="w-[140px] py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-colors mb-2 cursor-pointer inline-flex items-center justify-center gap-1 mx-auto hover:scale-[1.02]"
                    >
                      <span>Get Access</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="text-sm font-bold text-sky-400">
                      {getDynamicPlanPrice("diamond", isYearly, pricing)}
                      <span className="text-xs font-normal text-sky-300/70">
                        /mo
                      </span>
                    </div>
                    {isYearly && (
                      <div className="text-[10px] text-sky-300/60 mt-0.5">
                        Billed as {getDynamicYearlyTotal("diamond", pricing)}/yr
                      </div>
                    )}
                  </td>

                  {/* Family Footer */}
                  <td className="py-8 px-4 text-center">
                    <button
                      disabled
                      className="w-[120px] py-2.5 rounded-lg bg-brand-text/5 border border-brand-border text-brand-secondary opacity-40 font-semibold text-xs transition-colors mb-2 cursor-not-allowed uppercase font-mono tracking-wider"
                    >
                      Soon
                    </button>
                    <div className="text-sm font-bold text-brand-text">
                      {getDynamicPlanPrice("family", isYearly, pricing)}
                      <span className="text-xs font-normal text-brand-secondary">
                        /mo
                      </span>
                    </div>
                    {isYearly && (
                      <div className="text-[10px] text-brand-secondary/60 mt-0.5">
                        Billed as {getDynamicYearlyTotal("family", pricing)}/yr
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ─── Feature Banners ─── */}
        <MembershipFeaturesSection
          onChoosePlan={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
      </main>
    </div>
  );
}
