import { useNavigate } from "react-router";
import { Crown, Target, Users, Zap, BookOpen, Globe, ArrowLeft } from "lucide-react";
import { soundManager } from "@/utils/SoundManager";

interface ValueCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function ValueCard({ icon: Icon, title, description }: ValueCardProps) {
  return (
    <div
      className="flex gap-4 p-5 rounded-2xl border border-brand-border/40 bg-brand-surface/30 hover:border-brand-accent/30 hover:bg-brand-surface/50 transition-all duration-300"
    >
      <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center mt-0.5">
        <Icon className="w-5 h-5 text-brand-accent" />
      </div>
      <div>
        <h3 className="text-base font-display font-semibold text-brand-text mb-1">{title}</h3>
        <p className="text-sm text-brand-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

const values = [
  {
    icon: Target,
    title: "Purposeful Learning",
    description:
      "Every feature on XLChess is designed around a single goal: helping you improve. From structured lessons to tactical puzzles, each tool sharpens a different facet of your game.",
  },
  {
    icon: Users,
    title: "Community First",
    description:
      "Chess is richer when shared. XLChess fosters a respectful, global community of players, creators, and educators who push each other to grow.",
  },
  {
    icon: Zap,
    title: "Modern Performance",
    description:
      "Powered by state-of-the-art chess engines and a blazing-fast platform, XLChess delivers analysis and gameplay that keep pace with your thinking.",
  },
  {
    icon: BookOpen,
    title: "Depth of Knowledge",
    description:
      "From beginner fundamentals to grandmaster-level opening theory, our content library covers the full spectrum of chess knowledge.",
  },
  {
    icon: Globe,
    title: "Accessible Everywhere",
    description:
      "XLChess is designed to run flawlessly on any device, ensuring that wherever you are in the world, your chess journey continues uninterrupted.",
  },
  {
    icon: Crown,
    title: "Excellence as Standard",
    description:
      "We hold our platform, content, and community to the highest standard. Mediocrity is not an option when you are helping people excel at chess.",
  },
];

export default function AboutPage() {
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
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/5 mb-6">
              <Crown className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-xs font-mono text-brand-accent uppercase tracking-widest font-semibold">
                Our Story
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-4 leading-tight tracking-tight">
              About XLChess
            </h1>
            <p className="text-base sm:text-lg text-brand-secondary leading-relaxed max-w-2xl">
              XLChess was built for one reason: to help chess players at every
              level truly excel. We believe that world-class chess education
              should not be locked behind expensive tutors or obscure resources.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Mission */}
        <section
          className="mb-14"
        >
          <h2 className="text-xl font-display font-semibold mb-4 text-brand-text">Our Mission</h2>
          <div className="space-y-4 text-brand-secondary leading-relaxed">
            <p>
              XLChess is a modern chess platform dedicated to democratizing
              high-quality chess education and competitive play. Founded by a
              team of passionate chess enthusiasts and software engineers, our
              platform bridges the gap between casual players who want to learn
              and serious competitors who want to sharpen their edge.
            </p>
            <p>
              We started with a simple observation: the tools available to most
              chess players were either too basic to drive real improvement or
              too complex and expensive for everyday use. XLChess was built to
              change that — combining the depth of a professional-grade engine
              with the accessibility of a beautifully designed, intuitive
              interface.
            </p>
            <p>
              Today, XLChess offers interactive puzzles, structured lessons,
              variant games, creator channels, and a thriving community — all
              in one place. Whether you are picking up the game for the first
              time or preparing for a tournament, XLChess is your home for
              chess growth.
            </p>
          </div>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* Values Grid */}
        <section className="mb-14">
          <h2
            className="text-xl font-display font-semibold mb-6 text-brand-text"
          >
            What We Stand For
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map((v) => (
              <ValueCard key={v.title} {...v} />
            ))}
          </div>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* Team */}
        <section
          className="mb-14"
        >
          <h2 className="text-xl font-display font-semibold mb-4 text-brand-text">The Team</h2>
          <div className="space-y-4 text-brand-secondary leading-relaxed">
            <p>
              XLChess is built and maintained by a small but dedicated team
              spread across multiple time zones. Our core contributors include
              full-stack engineers, UX designers, chess coaches, and content
              creators — all united by a love for the game and a commitment to
              building software that matters.
            </p>
            <p>
              We operate with a lean, open culture. Decisions are made
              collaboratively, feedback from our community is taken seriously,
              and every feature shipped is the result of careful thought about
              how it serves our users. We do not build for the sake of building;
              we build to make your chess better.
            </p>
          </div>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* Contact CTA */}
        <section
          className="rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-8 text-center"
        >
          <h2 className="text-xl font-display font-semibold mb-3 text-brand-text">
            Want to Reach Out?
          </h2>
          <p className="text-brand-secondary leading-relaxed mb-6 max-w-xl mx-auto">
            Whether you have a question, a partnership proposal, or just want to
            say hello — we would love to hear from you. Our team typically
            responds within two business days.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-brand-accent/50 text-brand-accent hover:bg-brand-accent/10 transition-all duration-200 text-sm font-semibold font-sans"
          >
            Contact Us
          </a>
        </section>
      </div>
    </div>
  );
}
