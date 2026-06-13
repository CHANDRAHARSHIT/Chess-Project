/**
 * App.tsx
 * Root application component.
 * GSAP plugins are registered here via gsapConfig (runs once at module level).
 * The smooth-wrapper / smooth-content divs prepare for ScrollSmoother (Club)
 * and currently drive native CSS smooth scroll.
 */

// ── GSAP: register plugins immediately (before any component renders) ──────
import './utils/gsapConfig';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import ProductDemo from './components/ProductDemo';
import HowItWorks from './components/HowItWorks';
import BuiltFor from './components/BuiltFor';
import PartnerCTA from './components/PartnerCTA';
import Footer from './components/Footer';

function App() {
  return (
    /* smooth-wrapper + smooth-content: ScrollSmoother-ready DOM structure.
       ScrollTrigger uses #smooth-content as the scroller when Club is enabled. */
    <div id="smooth-wrapper">
      <div id="smooth-content">

        {/* Navigation — sits above the scroll layer */}
        <Navbar />

        {/* Landing Page Content */}
        <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col selection:bg-brand-accent selection:text-white">
          <main className="flex-1">

            {/* Section 1: Hero Visual and Brand Statement */}
            <Hero />

            {/* Section 2: Why Ownership Matters */}
            <Features />

            {/* Section 3: Interactive Product Demo (Chessboard + Stockfish) */}
            <ProductDemo />

            {/* Section 4: How It Works */}
            <HowItWorks />

            {/* Section 5: Built For target verticals */}
            <BuiltFor />

            {/* Section 6: Partner Call to Action */}
            <PartnerCTA />

          </main>

          {/* Footer Summary */}
          <Footer />
        </div>

      </div>
    </div>
  );
}

export default App;
