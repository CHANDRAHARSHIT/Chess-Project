import { useNavigate } from "react-router";
import { Paintbrush, Video, BookOpen, BarChart2, Users, Zap, ArrowLeft } from "lucide-react";
import { soundManager } from "@/shared/lib/SoundManager";

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
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

const creatorFeatures = [
  {
    icon: Video,
    title: "Your Own Channel",
    description:
      "Launch a dedicated creator channel on XLChess to publish video analyses, live game reviews, and structured series. Your content lives alongside a growing library of chess knowledge.",
  },
  {
    icon: BookOpen,
    title: "Publish Lessons",
    description:
      "Structure your expertise into interactive lesson modules. Guide students through openings, endgame technique, and tactical patterns with built-in chess board integration.",
  },
  {
    icon: BarChart2,
    title: "Creator Analytics",
    description:
      "Understand your audience with detailed analytics — view counts, lesson completion rates, subscriber growth, and engagement by content type.",
  },
  {
    icon: Users,
    title: "Grow a Subscriber Base",
    description:
      "Players can subscribe to your channel, receive notifications for new content, and save your lessons to their personal queues.",
  },
  {
    icon: Zap,
    title: "Monetization Tools",
    description:
      "Eligible creators can earn revenue through XLChess Premium referrals, exclusive paid content, and the creator partnership program.",
  },
  {
    icon: Paintbrush,
    title: "Creation Studio",
    description:
      "Use our purpose-built creation studio to record, annotate, and publish chess content directly from your browser — no external software required.",
  },
];

export default function CreatorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-brand-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 via-transparent to-brand-accent/3 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-2.5 sm:px-6 pt-6 pb-16 sm:pb-20 relative z-10">
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
              <Paintbrush className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-xs font-mono text-brand-accent uppercase tracking-widest font-semibold">
                Create
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-4 leading-tight tracking-tight">
              Creators on XLChess
            </h1>
            <p className="text-base sm:text-lg text-brand-secondary leading-relaxed max-w-2xl">
              Share your chess expertise with a passionate, engaged audience.
              Whether you are a grandmaster, a coach, or an enthusiastic
              amateur, XLChess gives you the tools to teach, inspire, and build
              a community around the game you love.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-2.5 sm:px-6 py-8 sm:py-12">
        {/* Why Create */}
        <section
          className="mb-14"
        >
          <h2 className="text-xl font-display font-semibold mb-4 text-brand-text">
            Why Create on XLChess?
          </h2>
          <div className="space-y-4 text-brand-secondary leading-relaxed">
            <p>
              XLChess is built for chess improvement, which means your content
              reaches an audience that is actively motivated to learn. Every
              viewer on XLChess is there because they want to get better at
              chess — not passively scrolling through a general-purpose social
              feed. That intentionality makes XLChess one of the highest-quality
              creator audiences in the chess space.
            </p>
            <p>
              We have designed the creator experience to minimize friction.
              You do not need to manage a separate YouTube channel, host your
              own website, or figure out a payment stack. XLChess handles
              hosting, streaming infrastructure, subscriber management, and
              payment processing — so you can focus entirely on creating great
              chess content.
            </p>
            <p>
              We believe creators are the backbone of a thriving chess
              community. Every partnership we build is built on mutual respect:
              you keep ownership of your content, we provide the platform, and
              we share in the success together.
            </p>
          </div>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* Creator Tools */}
        <section className="mb-14">
          <h2
            className="text-xl font-display font-semibold mb-6 text-brand-text"
          >
            Creator Tools and Features
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {creatorFeatures.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* Requirements */}
        <section
          className="mb-14"
        >
          <h2 className="text-xl font-display font-semibold mb-4 text-brand-text">
            Creator Guidelines
          </h2>
          <div className="space-y-4 text-brand-secondary leading-relaxed">
            <p>
              All content published on XLChess must comply with our Content
              Policy and Community Guidelines. We expect creators to maintain
              a respectful, educational, and accurate standard of chess
              content. Misleading analysis, promotion of cheating tools, or
              discriminatory conduct will result in content removal and
              potential account termination.
            </p>
            <p>
              Creators are responsible for ensuring they have the rights to
              all material they publish, including music, video clips, and
              third-party game annotations. Please review our Copyright page
              for details on how copyright applies to creator content.
            </p>
          </div>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* CTA */}
        <section
          className="rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-8 text-center"
        >
          <h2 className="text-xl font-display font-semibold mb-3 text-brand-text">
            Ready to Start Creating?
          </h2>
          <p className="text-brand-secondary leading-relaxed mb-6 max-w-xl mx-auto">
            Creator applications are currently open. Tell us about yourself,
            your chess background, and the kind of content you want to make.
            We will review your application and get back to you within five
            business days.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-brand-accent/50 text-brand-accent hover:bg-brand-accent/10 transition-all duration-200 text-sm font-semibold font-sans"
          >
            Apply to Become a Creator
          </a>
        </section>
      </div>
    </div>
  );
}
