import { useNavigate } from "react-router";
import { Code2, Zap, Shield, BookOpen, GitBranch, Globe, ArrowLeft } from "lucide-react";
import { soundManager } from "@/shared/lib/SoundManager";

interface EndpointProps {
  method: "GET" | "POST" | "DELETE" | "PUT";
  path: string;
  description: string;
}

const methodColors: Record<EndpointProps["method"], string> = {
  GET: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  POST: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  PUT: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  DELETE: "text-red-400 bg-red-400/10 border-red-400/30",
};

function Endpoint({ method, path, description }: EndpointProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-brand-border/30 last:border-0">
      <span
        className={`shrink-0 inline-block text-[11px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border w-14 text-center ${methodColors[method]}`}
      >
        {method}
      </span>
      <code className="shrink-0 text-[13px] font-mono text-brand-text bg-brand-surface/50 px-2 py-0.5 rounded">
        {path}
      </code>
      <span className="text-sm text-brand-secondary">{description}</span>
    </div>
  );
}

interface CapabilityCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function CapabilityCard({ icon: Icon, title, description }: CapabilityCardProps) {
  return (
    <div
      className="flex gap-4 p-5 rounded-2xl border border-brand-border/40 bg-brand-surface/30 hover:border-brand-accent/30 transition-all duration-300"
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

const capabilities = [
  {
    icon: Globe,
    title: "REST API",
    description:
      "A comprehensive REST API covering puzzles, games, user stats, openings, and more. JSON responses with predictable, versioned endpoints.",
  },
  {
    icon: Zap,
    title: "Webhooks",
    description:
      "Subscribe to real-time events — game completions, puzzle solves, rating changes, and account activity — and push them to your own systems.",
  },
  {
    icon: GitBranch,
    title: "OAuth 2.0",
    description:
      "Authenticate your users with XLChess via OAuth 2.0. Let players log in with their XLChess account on any third-party chess application.",
  },
  {
    icon: BookOpen,
    title: "Opening Explorer",
    description:
      "Programmatic access to the XLChess opening database, including move trees, statistics, and top grandmaster games for any given position.",
  },
  {
    icon: Shield,
    title: "Rate Limiting & SLAs",
    description:
      "Fair rate limits for free tiers and elevated limits for partners. Enterprise SLAs with 99.9% uptime guarantees available on request.",
  },
  {
    icon: Code2,
    title: "SDKs",
    description:
      "Official SDKs for JavaScript, Python, and Go. Community-maintained libraries for additional languages are linked in our documentation.",
  },
];

export default function DevelopersPage() {
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
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-4 leading-tight tracking-tight">
              XLChess for Developers
            </h1>
            <p className="text-base sm:text-lg text-brand-secondary leading-relaxed max-w-2xl">
              Build chess-powered applications on top of XLChess. Access our
              REST API, integrate OAuth login, stream game events via webhooks,
              and tap into our puzzle and opening databases — all with
              developer-first tooling designed for speed and reliability.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Capabilities Grid */}
        <section className="mb-14">
          <h2
            className="text-xl font-display font-semibold mb-6 text-brand-text"
          >
            Platform Capabilities
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {capabilities.map((c) => (
              <CapabilityCard key={c.title} {...c} />
            ))}
          </div>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* Sample Endpoints */}
        <section
          className="mb-14"
        >
          <h2 className="text-xl font-display font-semibold mb-2 text-brand-text">
            Sample API Endpoints
          </h2>
          <p className="text-sm text-brand-secondary mb-6 leading-relaxed">
            All endpoints are prefixed with{" "}
            <code className="text-brand-accent text-xs bg-brand-surface/60 px-1.5 py-0.5 rounded font-mono">
              https://api.xlchess.com/v1
            </code>
            . Authentication is via Bearer token in the Authorization header.
          </p>
          <div className="rounded-2xl border border-brand-border/40 bg-brand-surface/20 px-5 py-2">
            <Endpoint method="GET" path="/puzzles/daily" description="Retrieve today's daily puzzle" />
            <Endpoint method="GET" path="/puzzles/random" description="Fetch a random puzzle by difficulty and theme" />
            <Endpoint method="POST" path="/puzzles/{id}/attempt" description="Submit a solution attempt for a puzzle" />
            <Endpoint method="GET" path="/users/{username}/stats" description="Retrieve a user's rating and game statistics" />
            <Endpoint method="GET" path="/openings/explore" description="Explore the opening tree from a given FEN position" />
            <Endpoint method="GET" path="/games/{id}" description="Fetch a completed game by ID, including PGN" />
            <Endpoint method="POST" path="/oauth/token" description="Exchange an authorization code for an access token" />
          </div>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent mb-14" />

        {/* Getting Started */}
        <section
          className="mb-14"
        >
          <h2 className="text-xl font-display font-semibold mb-4 text-brand-text">Getting Started</h2>
          <div className="space-y-4 text-brand-secondary leading-relaxed">
            <p>
              To begin using the XLChess API, register for a developer account
              and create an application from the developer dashboard. You will
              receive a client ID and secret for OAuth flows, along with an API
              key for server-to-server requests.
            </p>
            <p>
              Free tier accounts are granted 1,000 requests per day across all
              endpoints. If you are building a production application and need
              higher rate limits or access to premium data (such as master-game
              databases or real-time broadcast feeds), apply for a Partner API
              key.
            </p>
            <p>
              Our documentation is hosted at{" "}
              <span className="text-brand-accent font-mono text-sm">docs.xlchess.com</span>{" "}
              and includes interactive API explorers, code samples in multiple
              languages, and detailed schema references. We maintain a
              changelog for all API versions and aim to provide at least 90
              days of notice before deprecating any endpoint.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section
          className="rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-8 text-center"
        >
          <Code2 className="w-8 h-8 text-brand-accent mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold mb-3 text-brand-text">
            Questions? Talk to the Team.
          </h2>
          <p className="text-brand-secondary leading-relaxed mb-6 max-w-xl mx-auto">
            Whether you are integrating the API for the first time or building
            a large-scale chess application, our developer relations team is
            happy to help. Reach out through our contact page.
          </p>
          <a
            href="/contact-us"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-brand-accent/50 text-brand-accent hover:bg-brand-accent/10 transition-all duration-200 text-sm font-semibold font-sans"
          >
            Contact Developer Relations
          </a>
        </section>
      </div>
    </div>
  );
}
