import { Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

/**
 * SubscriptionsPage Component
 * 
 * A placeholder page for the upcoming Subscriptions feature where users
 * will be able to follow and stay updated with their favorite chess creators.
 * Currently displays a "Coming Soon" badge and a back button to return home.
 */
export default function SubscriptionsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 select-none">
      {/* Glowing icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-brand-accent/20 blur-3xl scale-150" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-brand-accent/30 to-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
          <Users className="w-10 h-10 text-brand-accent" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-[-0.02em] leading-[1.05] mb-5">
        <span className="block text-brand-text font-display">
          Subscriptions
        </span>
      </h1>

      {/* Subtitle */}
      <p className="font-sans text-base sm:text-[17px] leading-relaxed max-w-xl text-brand-secondary text-center mb-8">
        Follow your favorite chess creators and stay up to date with their latest content. This feature is coming soon.
      </p>

      {/* Coming soon badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-accent/10 border border-brand-accent/20 mb-8">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-accent" />
        </span>
        <span className="text-brand-accent text-sm font-medium tracking-wide">Coming Soon</span>
      </div>

      <Link 
        to="/"
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-brand-text/5 hover:bg-brand-text/10 border border-brand-text/10 hover:border-brand-text/20 transition-all text-brand-text/80 hover:text-brand-text group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </Link>
    </div>
  );
}
