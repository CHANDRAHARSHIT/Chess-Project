import { motion, type Variants } from "framer-motion";
import { useNavigate } from "react-router";
import {
  HelpCircle,
  Zap,
  Puzzle,
  BookOpen,
  Crown,
  BarChart2,
  Users,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { soundManager } from "../utils/SoundManager";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" },
  }),
};

interface StepProps {
  number: number;
  title: string;
  description: string;
  index: number;
}

function Step({ number, title, description, index }: StepProps) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex gap-5"
    >
      <div className="shrink-0 w-9 h-9 rounded-full border border-brand-accent/40 bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold font-mono text-sm mt-0.5">
        {number}
      </div>
      <div>
        <h3 className="text-base font-semibold text-brand-text mb-1">{title}</h3>
        <p className="text-sm text-brand-secondary leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

interface FeatureSectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  bullets: string[];
  index: number;
  href?: string;
  linkLabel?: string;
}

function FeatureSection({
  icon: Icon,
  title,
  description,
  bullets,
  index,
  href,
  linkLabel,
}: FeatureSectionProps) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="p-6 rounded-2xl border border-brand-border/40 bg-brand-surface/20 hover:border-brand-accent/20 transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-brand-accent" />
        </div>
        <h3 className="text-base font-semibold text-brand-text">{title}</h3>
      </div>
      <p className="text-sm text-brand-secondary leading-relaxed mb-3">{description}</p>
      <ul className="space-y-1">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-brand-secondary">
            <span className="text-brand-accent mt-1 shrink-0">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {href && linkLabel && (
        <a
          href={href}
          className="inline-block mt-4 text-sm text-brand-accent hover:underline transition-colors"
        >
          {linkLabel} →
        </a>
      )}
    </motion.div>
  );
}

const features = [
  {
    icon: Zap,
    title: "Quick Game",
    description:
      "Jump directly into a live chess game against players of a similar rating. Games are time-controlled and rated, so every result matters to your progression.",
    bullets: [
      "Choose from Bullet, Blitz, Rapid, and Classical time formats",
      "Smart matchmaking pairs you against opponents at your level",
      "Post-game analysis powered by our chess engine",
    ],
    href: "/play",
    linkLabel: "Play a Quick Game",
  },
  {
    icon: Puzzle,
    title: "Puzzles",
    description:
      "Train your tactical vision with thousands of hand-curated puzzles, organized by theme and difficulty. The daily puzzle is updated every 24 hours.",
    bullets: [
      "Tactical themes: forks, pins, skewers, sacrifices, and more",
      "Difficulty ratings from 400 to 2,800+ Elo",
      "Streak tracking and personal accuracy statistics",
    ],
    href: "/puzzles",
    linkLabel: "Start Solving Puzzles",
  },
  {
    icon: BookOpen,
    title: "Lessons",
    description:
      "Structured, interactive chess lessons that guide you from beginner fundamentals to advanced strategic concepts, delivered by experienced coaches and creators.",
    bullets: [
      "Beginner, Intermediate, and Advanced learning tracks",
      "Interactive board exercises within every lesson",
      "Save your progress and resume at any point",
    ],
  },
  {
    icon: Crown,
    title: "XLChess Premium",
    description:
      "Unlock the full XLChess experience with a Premium subscription. Access the complete lesson library, unlimited puzzles, and advanced analytics.",
    bullets: [
      "Unlimited access to all courses and lesson series",
      "Detailed game review with engine annotations",
      "Priority matchmaking and ad-free experience",
    ],
    href: "/pricing",
    linkLabel: "View Pricing",
  },
  {
    icon: BarChart2,
    title: "Stats and Progress",
    description:
      "Track your improvement over time with a rich set of statistics covering every aspect of your game — from puzzle accuracy to opening win rates.",
    bullets: [
      "Rating history graph across all time controls",
      "Opening performance broken down by color",
      "Tactical accuracy trends and puzzle statistics",
    ],
  },
  {
    icon: Users,
    title: "Community and Creators",
    description:
      "Follow your favorite chess creators, subscribe to lesson series, and stay engaged with a community of players who are serious about improvement.",
    bullets: [
      "Subscribe to creator channels for content updates",
      "Join community tournaments and leaderboard events",
      "Discussion boards for openings, games, and strategy",
    ],
  },
];

const gettingStartedSteps = [
  {
    title: "Create a Free Account",
    description:
      "Sign up with your email address or connect via Google or Discord. It takes under a minute and gives you immediate access to puzzles, Quick Game, and basic stats.",
  },
  {
    title: "Set Your Skill Level",
    description:
      "Complete a brief calibration puzzle set so that XLChess can recommend the right lessons, match you against appropriate opponents, and track your progress from a meaningful baseline.",
  },
  {
    title: "Play Your First Game",
    description:
      "Head to Quick Game, choose your preferred time control, and get matched instantly. Every game is followed by an automated engine review so you can spot mistakes and learn right away.",
  },
  {
    title: "Train with Puzzles",
    description:
      "Set a daily puzzle goal in your settings. Even 10 puzzles per day — consistently applied over weeks and months — produces measurable tactical improvement.",
  },
  {
    title: "Explore Lessons",
    description:
      "Browse the lesson library and start with a topic that addresses a known weakness in your game. Lessons are organized into tracks so you always know what to study next.",
  },
  {
    title: "Upgrade to Premium (Optional)",
    description:
      "When you are ready to access the full depth of XLChess — unlimited lessons, advanced analytics, and all creator content — upgrading to Premium takes a few seconds.",
  },
];

export default function HowXLChessWorksPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-brand-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 via-transparent to-brand-accent/3 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-16 sm:pb-20 relative z-10">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                navigate("/");
              }}
              className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Home</span>
            </button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/5 mb-6">
              <HelpCircle className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-xs font-mono text-brand-accent uppercase tracking-widest font-semibold">
                Guide
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight tracking-tight">
              How XLChess Works
            </h1>
            <p className="text-base sm:text-lg text-brand-secondary leading-relaxed max-w-2xl">
              XLChess is an all-in-one platform for playing, learning, and
              mastering chess. This guide walks you through every major feature
              of the platform and explains how to make the most of your time
              here.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Getting Started */}
        <motion.section
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-14"
        >
          <h2 className="text-xl font-semibold mb-6 text-brand-text">
            Getting Started
          </h2>
          <div className="space-y-6">
            {gettingStartedSteps.map((step, i) => (
              <Step
                key={step.title}
                number={i + 1}
                title={step.title}
                description={step.description}
                index={i + 1}
              />
            ))}
          </div>
        </motion.section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* Feature Breakdown */}
        <section className="mb-14">
          <motion.h2
            custom={8}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-xl font-semibold mb-6 text-brand-text"
          >
            Platform Features
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <FeatureSection key={f.title} {...f} index={i + 9} />
            ))}
          </div>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* Settings / Customization */}
        <motion.section
          custom={16}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-brand-accent shrink-0" />
            <h2 className="text-xl font-semibold text-brand-text">
              Personalizing Your Experience
            </h2>
          </div>
          <div className="space-y-4 text-brand-secondary leading-relaxed">
            <p>
              XLChess is designed to be fully customizable. From your settings
              page you can choose your preferred board theme, piece set, and
              color scheme. Sound effects, move animations, and coordinate
              labels are all individually configurable.
            </p>
            <p>
              You can also configure notification preferences, manage your
              subscription, update your privacy settings, and link or unlink
              third-party sign-in providers. All preferences are synced to your
              account, so your settings follow you across devices.
            </p>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          custom={17}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-8 text-center"
        >
          <h2 className="text-xl font-semibold mb-3 text-brand-text">
            Still Have Questions?
          </h2>
          <p className="text-brand-secondary leading-relaxed mb-6 max-w-xl mx-auto">
            If anything about the platform is unclear or you need help getting
            started, our support team is standing by. We also have a community
            forum where experienced players are happy to help newcomers.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-brand-accent/50 text-brand-accent hover:bg-brand-accent/10 transition-all duration-200 text-sm font-semibold font-sans"
          >
            Contact Support
          </a>
        </motion.section>
      </div>
    </div>
  );
}
