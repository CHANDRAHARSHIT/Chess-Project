import { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  useScrollReveal(footerRef as React.RefObject<Element | null>, { y: 40, duration: 0.7 });

  const handlePlayClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const demoSection = document.getElementById('interactive-demo');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer
      ref={footerRef}
      className="py-12 md:py-16"
      style={{ opacity: 0, backgroundColor: '#0F1D4D' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Brand Signature — static logo, no animation, no hover */}
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="XLChess logo"
              style={{ width: '220px', maxWidth: '240px', height: 'auto', display: 'block' }}
              draggable={false}
            />
          </div>

          {/* Copyright — centered */}
          <p className="font-sans text-xs text-brand-secondary text-center">
            &copy; 2026 XLChess. Demo concept
          </p>

          {/* Single "Play" link */}
          <div className="flex items-center">
            <a
              href="#interactive-demo"
              onClick={handlePlayClick}
              className="font-sans text-xs text-brand-secondary hover:text-white transition-colors"
            >
              Play
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}
