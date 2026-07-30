import { useEffect } from 'react';
import { useLocation } from 'react-router';
import Hero from '../components/Hero';
import BrandSection from '../components/BrandSection';
import ProductDemo from '../components/ProductDemo';


export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const scrollTarget = params.get('scroll');
    if (scrollTarget === 'interactive-demo') {
      const demoSection = document.getElementById('interactive-demo');
      if (demoSection) {
        // Delay slightly to allow the layout to settle/render
        const timer = setTimeout(() => {
          demoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen text-brand-text flex flex-col">
      <main className="flex-1">
        {/* Section 1: Hero Visual and Brand Statement */}
        <Hero />

        {/* Section 2: Build More Than Subscribers */}
        <BrandSection />

        {/* Section 3: Interactive Product Demo (Chessboard + Stockfish) */}
        <ProductDemo />

        {/* Section 4: Partner Call to Action */}

      </main>
    </div>
  );
}
