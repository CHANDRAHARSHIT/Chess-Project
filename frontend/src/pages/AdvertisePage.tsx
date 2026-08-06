import { motion, type Variants } from "framer-motion";
import { useNavigate } from "react-router";
import { Megaphone, Target, Users, BarChart2, Globe, Zap, ArrowLeft } from "lucide-react";
import { soundManager } from "../utils/SoundManager";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: "easeOut" },
  }),
};

interface AdFormatCardProps {
  title: string;
  description: string;
  tag: string;
  index: number;
}

function AdFormatCard({ title, description, tag, index }: AdFormatCardProps) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="p-5 rounded-2xl border border-brand-border/40 bg-brand-surface/30 hover:border-brand-accent/30 hover:bg-brand-surface/50 transition-all duration-300"
    >
      <span className="inline-block text-xs font-mono text-brand-accent uppercase tracking-widest bg-brand-accent/10 border border-brand-accent/20 rounded-full px-2.5 py-0.5 mb-3">
        {tag}
      </span>
      <h3 className="text-base font-semibold text-brand-text mb-2">{title}</h3>
      <p className="text-sm text-brand-secondary leading-relaxed">{description}</p>
    </motion.div>
  );
}

const adFormats = [
  {
    title: "Sponsored Lessons",
    description:
      "Partner with XLChess to sponsor a lesson series. Your brand is presented tastefully within high-quality educational content consumed by motivated learners.",
    tag: "Content",
  },
  {
    title: "Display Placements",
    description:
      "Reach users across the XLChess platform with beautifully designed display ads in the sidebar, lesson library, and puzzle interface.",
    tag: "Display",
  },
  {
    title: "Puzzle Sponsorships",
    description:
      "Sponsor the daily puzzle — one of the most-visited pages on the platform — and put your brand in front of users at their most engaged moment.",
    tag: "Sponsorship",
  },
  {
    title: "Creator Partnerships",
    description:
      "Work directly with top XLChess creators to develop authentic, integrated brand messaging that resonates with a chess-passionate audience.",
    tag: "Influencer",
  },
  {
    title: "Email Newsletters",
    description:
      "Feature your brand in the XLChess weekly newsletter, sent to thousands of active players who are passionate about chess improvement.",
    tag: "Email",
  },
  {
    title: "Event Sponsorships",
    description:
      "Sponsor XLChess-hosted tournaments and community events to gain prominent brand exposure within competitive chess circles.",
    tag: "Events",
  },
];

const stats = [
  { icon: Users, value: "50,000+", label: "Registered Players" },
  { icon: Target, value: "85%", label: "Return Visit Rate" },
  { icon: Globe, value: "120+", label: "Countries Represented" },
  { icon: BarChart2, value: "4.2 min", label: "Avg. Session Length" },
];

export default function AdvertisePage() {
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
              <Megaphone className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-xs font-mono text-brand-accent uppercase tracking-widest font-semibold">
                Partners
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight tracking-tight">
              Advertise on XLChess
            </h1>
            <p className="text-base sm:text-lg text-brand-secondary leading-relaxed max-w-2xl">
              Connect your brand with a highly engaged, intellectually curious
              chess community. XLChess offers premium advertising and
              partnership opportunities that place your message in front of
              players who are passionate, attentive, and growth-oriented.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Audience Stats */}
        <motion.section
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-14"
        >
          <h2 className="text-xl font-semibold mb-6 text-brand-text">
            Our Audience
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  custom={i + 1}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center text-center p-5 rounded-2xl border border-brand-border/40 bg-brand-surface/30"
                >
                  <Icon className="w-5 h-5 text-brand-accent mb-2" />
                  <span className="text-2xl font-bold text-brand-text">{s.value}</span>
                  <span className="text-xs text-brand-secondary mt-1 leading-snug">{s.label}</span>
                </motion.div>
              );
            })}
          </div>
          <div className="space-y-4 text-brand-secondary leading-relaxed">
            <p>
              The XLChess audience skews toward educated, tech-savvy adults
              between the ages of 18 and 45. Our users are proactive learners
              who seek improvement — a mindset that translates exceptionally
              well to high-consideration purchasing decisions. Whether you are
              marketing a chess product, a learning platform, a premium
              consumer brand, or a financial services offering, XLChess delivers
              a uniquely qualified audience.
            </p>
            <p>
              Unlike broad social platforms, XLChess users come to the platform
              with intent. They are solving puzzles, completing lessons, and
              analyzing games — deeply engaged activities that create long,
              high-attention sessions ideal for brand exposure.
            </p>
          </div>
        </motion.section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* Ad Formats */}
        <section className="mb-14">
          <motion.h2
            custom={6}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-xl font-semibold mb-6 text-brand-text"
          >
            Advertising Formats
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {adFormats.map((f, i) => (
              <AdFormatCard key={f.title} {...f} index={i + 7} />
            ))}
          </div>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* Brand Safety */}
        <motion.section
          custom={14}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-14"
        >
          <h2 className="text-xl font-semibold mb-4 text-brand-text">
            Brand Safety and Values
          </h2>
          <div className="space-y-4 text-brand-secondary leading-relaxed">
            <p>
              XLChess is a platform built on respect, sportsmanship, and
              intellectual pursuit. We curate our advertising partners carefully
              to ensure that every brand appearing on XLChess aligns with
              these values. We do not accept advertising from gambling
              operators, tobacco companies, or brands whose practices conflict
              with our community guidelines.
            </p>
            <p>
              We maintain editorial independence. Sponsored content is clearly
              labeled, and our editorial team retains full control over
              platform content, lesson quality standards, and community
              moderation.
            </p>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          custom={15}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-8 text-center"
        >
          <Zap className="w-8 h-8 text-brand-accent mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-3 text-brand-text">
            Let's Build Something Together
          </h2>
          <p className="text-brand-secondary leading-relaxed mb-6 max-w-xl mx-auto">
            We work with a limited number of advertising partners to ensure
            quality and relevance for our users. Reach out to our partnerships
            team to discuss your goals and explore what we can build together.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-brand-accent/50 text-brand-accent hover:bg-brand-accent/10 transition-all duration-200 text-sm font-semibold font-sans"
          >
            Contact Our Partnerships Team
          </a>
        </motion.section>
      </div>
    </div>
  );
}
