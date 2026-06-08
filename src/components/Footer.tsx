import { Crown } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-bg border-t border-brand-border py-12 md:py-16 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand Signature */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-accent rounded flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <span className="font-sans font-bold text-base tracking-tight text-white">
              Chess<span className="text-brand-accent">Craft</span>
            </span>
          </div>

          {/* Copy statement */}
          <p className="font-sans text-xs text-brand-secondary text-center md:text-left">
            &copy; {new Date().getFullYear()} ChessCraft. All rights reserved. 
            Designed for independent chess educators and academies.
          </p>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="#why-ownership"
              className="font-sans text-xs text-brand-secondary hover:text-white transition-colors"
            >
              Why Ownership
            </a>
            <a
              href="#interactive-demo"
              className="font-sans text-xs text-brand-secondary hover:text-white transition-colors"
            >
              Interactive Demo
            </a>
            <a
              href="#partner-cta"
              className="font-sans text-xs text-brand-secondary hover:text-white transition-colors"
            >
              Contact Pilot
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}
