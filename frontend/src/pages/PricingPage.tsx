import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  Star,
  Sparkles,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Gamepad2,
  Info,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useNavigationStack } from "../hooks/useNavigationStack";

// Custom SVG Chess Pieces for premium decorative background
const PieceSvg: React.FC<{
  type: "king" | "queen" | "rook" | "knight" | "bishop";
}> = ({ type }) => {
  switch (type) {
    case "king":
      return (
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-brand-accent/10 stroke-brand-accent/20 stroke-[0.8] drop-shadow-[0_0_15px_rgba(212,175,110,0.1)]"
        >
          <path d="M48 8h4v14h-4z" />
          <path d="M44 12h12v4H44z" />
          <path d="M50 22c14 0 20 8 20 22 0 14-8 20-12 24H42c-4-4-12-10-12-24 0-14 6-22 20-22z" />
          <path d="M30 72h40v8H30z" />
          <path d="M24 80h52v8H24z" />
        </svg>
      );
    case "queen":
      return (
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-brand-accent/10 stroke-brand-accent/20 stroke-[0.8] drop-shadow-[0_0_15px_rgba(212,175,110,0.1)]"
        >
          <path d="M50 16a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm22 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-44 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
          <path d="M25 32l8 16 17-21 17 21 8-16 5 36H20l5-36z" />
          <path d="M28 72h44v8H28z" />
          <path d="M22 80h56v8H22z" />
        </svg>
      );
    case "rook":
      return (
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-brand-accent/10 stroke-brand-accent/20 stroke-[0.8] drop-shadow-[0_0_15px_rgba(212,175,110,0.1)]"
        >
          <path d="M27 18h10v10h8V18h10v10h8V18h10v21H27V18z" />
          <path d="M35 39h30l-4 34H39L35 39z" />
          <path d="M30 73h40v8H30z" />
          <path d="M24 81h52v8H24z" />
        </svg>
      );
    case "knight":
      return (
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-brand-accent/10 stroke-brand-accent/20 stroke-[0.8] drop-shadow-[0_0_15px_rgba(212,175,110,0.1)]"
        >
          <path d="M61 12c15 7 24 22 24 40 0 10-4 20-10 28H40c2-11 8-20 18-27-9 0-17-4-24-11l5-16c6 4 12 6 18 6-4-4-6-9-6-15l10-5z" />
          <path d="M42 80h38v8H42z" />
          <path d="M34 88h52v7H34z" />
          <circle cx="58" cy="31" r="3" fill="rgba(8,11,20,0.3)" />
        </svg>
      );
    case "bishop":
      return (
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-brand-accent/10 stroke-brand-accent/20 stroke-[0.8] drop-shadow-[0_0_15px_rgba(212,175,110,0.1)]"
        >
          <path d="M50 10c5 0 9 4 9 9 0 4-2 7-5 8 13 9 21 24 21 39 0 10-10 13-25 13S25 76 25 66c0-15 8-30 21-39-3-1-5-4-5-8 0-5 4-9 9-9z" />
          <path d="M31 79h38v8H31z" />
          <path d="M24 87h52v7H24z" />
        </svg>
      );
    default:
      return null;
  }
};

interface PlanProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
  yearlySaving?: string;
  onCtaClick: () => void;
}

const PricingCard: React.FC<PlanProps> = ({
  name,
  price,
  period,
  description,
  features,
  ctaText,
  isPopular = false,
  yearlySaving,
  onCtaClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
      transition={{ duration: 0.6 }}
      className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden transition-all duration-500
        ${isPopular
          ? "bg-gradient-to-b from-brand-surface to-brand-bg border border-brand-accent/30 shadow-[0_20px_50px_rgba(212,175,110,0.06)]"
          : "bg-brand-surface/60 backdrop-blur-xl border border-[rgba(212,175,110,0.40)] hover:border-brand-accent/20"
        }
      `}
    >
      {/* Decorative Gold Radial Light behind popular card */}
      {isPopular && (
        <div className="absolute -top-[120px] -right-[120px] w-[240px] h-[240px] rounded-full bg-brand-accent/10 blur-[60px] pointer-events-none" />
      )}

      <div>
        {/* Popular Badge */}
        {isPopular && (
          <div className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-accent/15 border border-brand-accent/30 text-brand-accent text-[11px] font-mono tracking-wider uppercase font-medium">
            <Star className="w-3.5 h-3.5 fill-current" />
            Most Popular
          </div>
        )}

        {/* Plan Header */}
        <div className="mb-6">
          <h3 className="text-xl sm:text-2xl font-display font-medium text-brand-text tracking-wide mb-2">
            {name}
          </h3>
          <p className="text-sm text-brand-secondary font-sans leading-relaxed">
            {description}
          </p>
        </div>

        {/* Pricing Area */}
        <div className="mb-8 flex flex-col justify-end min-h-[85px]">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-display font-bold text-brand-text text-gold-gradient">
              {price}
            </span>
            {period && (
              <span className="text-sm font-sans text-brand-secondary tracking-wide">
                {period}
              </span>
            )}
          </div>

          {/* Savings Badge */}
          {yearlySaving && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-max"
            >
              {yearlySaving}
            </motion.div>
          )}
        </div>

        {/* Feature List */}
        <ul className="space-y-4 mb-8">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5
                ${isPopular ? "bg-brand-accent/15 text-brand-accent" : "bg-brand-text/5 text-brand-secondary"}
              `}
              >
                <Check className="w-3 h-3" />
              </span>
              <span className="text-sm font-sans text-brand-text leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Button */}
      <button
        onClick={onCtaClick}
        className={`w-full py-3.5 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold transition-all duration-300 relative overflow-hidden cursor-pointer
          ${isPopular
            ? "btn-premium-cta cta-shine text-brand-accent border-brand-accent/40 shadow-lg hover:scale-[1.01]"
            : "bg-brand-text/5 border border-white/10 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text active:scale-[0.99]"
          }
        `}
      >
        <span className="relative z-10">{ctaText}</span>
      </button>
    </motion.div>
  );
};

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getPrevious } = useNavigationStack();
  const [isYearly, setIsYearly] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const [showSessionError, setShowSessionError] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("error") === "payment_expired";
  });

  // Navigate back to PREVIOUS page
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

  const faqs = [
    {
      q: "What happens if I cancel?",
      a: "You will retain access to all Premium features until the end of your current billing period (monthly or yearly). After that, your account will revert to the Free tier. Your saved game history, analysis, and custom configurations will remain safely stored, though advanced engine tool access will be locked.",
    },
    {
      q: "Can I switch plans?",
      a: "Yes, absolutely! You can switch from monthly to yearly billing at any time to lock in the 66% discount. The remaining time on your monthly plan will be credited pro-rata toward the cost of the yearly plan automatically.",
    },
    {
      q: "Do yearly plans save money?",
      a: "Yes. The yearly plan saves you 66% compared to paying monthly. This brings your effective monthly rate down to just $1.70 USD, saving you $39.60 USD over a full year compared to standard monthly renewals.",
    },
    {
      q: "Can I upgrade anytime?",
      a: "Yes! You can instantly upgrade your account from anywhere on the platform. The pricing is prorated, meaning you'll only pay the difference for the remainder of your current billing cycle.",
    },
    {
      q: "Is my payment secure?",
      a: "We prioritize transactional security above all else. We process all payments using world-class certified secure payment gateways with industry-standard 256-bit encryption. Your credit card or banking details are never stored on our servers.",
    },
  ];

  const featuresList = [
    { name: "Unlimited Games", free: true, premium: true },
    {
      name: "Engine Analysis",
      free: "Basic",
      premium: "Unlimited (Deep Stockfish)",
    },
    { name: "Game Review", free: false, premium: true },
    { name: "Puzzle Training", free: "Daily Limit", premium: "Unlimited" },
    {
      name: "Opening Explorer",
      free: "Limited Depth",
      premium: "Advanced Explorer",
    },
    { name: "Performance Insights", free: false, premium: true },
    { name: "Priority Support", free: false, premium: true },
    { name: "Ad Free", free: false, premium: true },
    { name: "Premium Themes", free: false, premium: true },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative overflow-hidden select-none pb-16 sm:pb-24">
      {/* ── BACKGROUND ORNAMENTATION ─────────────────────────────────────────── */}
      {/* Ambient background glows */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[1200px] h-[500px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10vw] w-[40vw] h-[40vw] bg-brand-accent/3 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Elegant floating chess pieces for page specific design */}
      <div className="absolute top-[20%] left-[8%] w-24 h-24 pointer-events-none opacity-40 md:block hidden z-0">
        <motion.div
          animate={{
            y: [0, -18, 0],
            rotate: [5, -5, 5],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <PieceSvg type="bishop" />
        </motion.div>
      </div>

      <div className="absolute top-[15%] right-[10%] w-28 h-28 pointer-events-none opacity-30 md:block hidden z-0">
        <motion.div
          animate={{
            y: [0, 22, 0],
            rotate: [-10, 8, -10],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <PieceSvg type="queen" />
        </motion.div>
      </div>

      <div className="absolute bottom-[35%] left-[5%] w-28 h-28 pointer-events-none opacity-30 md:block hidden z-0">
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [-8, 8, -8],
          }}
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
          animate={{
            y: [0, -16, 0],
            rotate: [4, -12, 4],
          }}
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
        {showSessionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-sans flex items-center justify-between gap-3 shadow-md z-30"
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

        {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
        <section className="text-center pt-16 sm:pt-20 pb-12 sm:pb-16 max-w-3xl flex flex-col items-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-surface/80 border border-brand-border backdrop-blur-sm text-brand-accent text-xs font-sans tracking-wide mb-6 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trusted by thousands of chess players</span>
          </motion.div>

          {/* Heading */}
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

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-brand-secondary font-sans leading-relaxed max-w-2xl px-2"
          >
            Take your game to the next level with deep Stockfish engine
            analysis, unlimited game reviews, personalized accuracy reports, and
            comprehensive puzzles.
          </motion.p>
        </section>

        {/* ── PRICING TOGGLE ─────────────────────────────────────────────────── */}
        <section className="mb-14 sm:mb-18 z-20">
          <div className="bg-brand-surface/90 border border-brand-border p-1.5 rounded-2xl flex items-center relative shadow-xl">
            <button
              onClick={() => setIsYearly(false)}
              className={`relative z-10 px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-300 cursor-pointer min-w-[120px] text-center
                ${!isYearly ? "text-brand-bg" : "text-brand-secondary hover:text-brand-text"}
              `}
            >
              {/* Animated active BG slider */}
              {!isYearly && (
                <motion.div
                  layoutId="activeToggle"
                  className="absolute inset-0 bg-brand-accent rounded-xl -z-10 shadow-lg shadow-brand-accent/20"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              Monthly
            </button>

            <button
              onClick={() => setIsYearly(true)}
              className={`relative z-10 px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-300 cursor-pointer min-w-[120px] text-center flex items-center justify-center gap-1.5
                ${isYearly ? "text-brand-bg" : "text-brand-secondary hover:text-brand-text"}
              `}
            >
              {isYearly && (
                <motion.div
                  layoutId="activeToggle"
                  className="absolute inset-0 bg-brand-accent rounded-xl -z-10 shadow-lg shadow-brand-accent/20"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              Yearly
            </button>

            {/* Save 66% indicator */}
            <div className="absolute z-20 top-0 left-3/4 -translate-x-1/2 -translate-y-1/2 sm:left-[calc(100%+14px)] sm:top-1/2 sm:translate-x-0 whitespace-nowrap bg-brand-accent/15 border border-brand-accent/30 text-brand-accent text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
              Save 66%
            </div>
          </div>
        </section>

        {/* ── PRICING CARDS ──────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full px-4 mb-20 sm:mb-24 z-10">
          {/* FREE PLAN */}
          <PricingCard
            name="Free Plan"
            price="Free"
            period=""
            description="Perfect for casual players looking to play online and solve daily puzzles."
            features={[
              "Unlimited Online Games",
              "Play Against Stockfish",
              "Daily Puzzles",
              "Game History",
              "Public Leaderboards",
              "Basic Analysis",
              "Community Access",
            ]}
            ctaText="Current Plan"
            onCtaClick={() =>
              alert("You are already enjoying our free features!")
            }
          />

          {/* PREMIUM PLAN */}
          <PricingCard
            name="Premium Plan"
            price={isYearly ? "$20.40 USD" : "$5.00 USD"}
            period={isYearly ? "/ year" : "/ month"}
            yearlySaving={
              isYearly
                ? "Save $39.60 USD (Equivalent to $1.70 USD/mo)"
                : undefined
            }
            description="Built for ambitious chess players who want unlimited reviews, deep analysis, and tracking."
            features={[
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
            ]}
            ctaText="Upgrade to Premium"
            isPopular={true}
            onCtaClick={() => handleUpgrade(isYearly ? "Yearly" : "Monthly")}
          />
        </section>

        {/* ── FEATURE COMPARISON ─────────────────────────────────────────────── */}
        <section className="w-full max-w-4xl px-4 mb-20 sm:mb-28 z-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-brand-text mb-3">
              Compare Features
            </h2>
            <p className="text-sm text-brand-secondary font-sans">
              Choose the depth of tools that fits your learning style.
            </p>
          </div>

          <div className="bg-brand-surface/60 backdrop-blur-xl border border-brand-border rounded-2xl overflow-hidden shadow-2xl">
            {/* Desktop Table view */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-[rgba(212,175,110,0.60)] bg-brand-text/[0.02]">
                    <th className="py-4 px-6 text-xs font-sans font-bold tracking-wider text-brand-secondary uppercase min-w-[200px]">
                      Feature
                    </th>
                    <th className="py-4 px-6 text-xs font-sans font-bold tracking-wider text-brand-secondary uppercase text-center min-w-[160px] w-1/4">
                      Free
                    </th>
                    <th className="py-4 px-6 text-xs font-sans font-bold tracking-wider text-brand-accent uppercase text-center min-w-[240px] w-1/3">
                      Premium
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {featuresList.map((feature, index) => (
                    <tr
                      key={index}
                      className="hover:bg-brand-text/[0.01] transition-colors duration-150"
                    >
                      <td className="py-2 px-6 text-sm font-sans font-medium text-brand-text">
                        {feature.name}
                      </td>
                      <td className="py-3 px-6 text-center text-sm font-sans text-brand-secondary">
                        {typeof feature.free === "boolean" ? (
                          feature.free ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-brand-secondary/40">—</span>
                          )
                        ) : (
                          <span className="inline-block whitespace-nowrap font-mono text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-brand-secondary">
                            {feature.free}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-center text-sm font-sans text-brand-accent font-semibold">
                        {typeof feature.premium === "boolean" ? (
                          feature.premium ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-brand-secondary/40">—</span>
                          )
                        ) : (
                          <span className="inline-block whitespace-nowrap font-mono text-xs bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-1 rounded-lg text-brand-accent">
                            {feature.premium}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FAQ ACCORDION ─────────────────────────────────────────────────── */}
        <section className="w-full max-w-3xl px-4 mb-20 sm:mb-28 z-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-brand-text mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-brand-secondary font-sans">
              Everything you need to know about XLChess premium accounts.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-brand-surface/60 backdrop-blur-xl border border-brand-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-brand-accent/20"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left py-5 px-6 font-display font-medium text-base sm:text-lg text-brand-text hover:text-brand-accent transition-colors duration-200 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-brand-secondary"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-5 pt-1 text-sm sm:text-base text-brand-secondary font-sans leading-relaxed border-t border-[rgba(212,175,110,0.20)]">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FINAL CTA SECTION ──────────────────────────────────────────────── */}
        <section className="w-full max-w-4xl px-4 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden bg-gradient-to-b from-brand-surface/90 to-brand-bg/95 border border-brand-accent/20 shadow-[0_20px_50px_rgba(212,175,110,0.04)]"
          >
            {/* Background elements */}
            <div className="absolute top-[-100px] left-[-100px] w-[200px] h-[200px] bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-100px] right-[-100px] w-[200px] h-[200px] bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />

            <Trophy className="w-12 h-12 text-brand-accent mx-auto mb-6 drop-shadow-[0_0_10px_rgba(212,175,110,0.3)] animate-pulse" />

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-brand-text mb-4 tracking-tight">
              Ready to Level Up Your Chess?
            </h2>

            <p className="text-sm sm:text-base text-brand-secondary font-sans max-w-xl mx-auto mb-8 leading-relaxed">
              Join thousands of chess players analyzing, learning, and improving
              their play daily. Elevate your tactical edge now.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => handleUpgrade(isYearly ? "Yearly" : "Monthly")}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold btn-premium-cta btn-glow-container btn-glow-accent cta-shine cursor-pointer shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span>Start Premium</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleNavigateBack}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold bg-brand-text/5 border border-white/10 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-all duration-300 cursor-pointer active:scale-[0.99]"
              >
                Continue Free
              </button>
            </div>

            {/* Micro-guarantees */}
            <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-brand-secondary">
                <ShieldCheck className="w-4 h-4 text-brand-accent" />
                Secure Payments
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-secondary">
                <Gamepad2 className="w-4 h-4 text-brand-accent" />
                Cancel Anytime
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-secondary">
                <Info className="w-4 h-4 text-brand-accent" />
                No Hidden Fees
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}