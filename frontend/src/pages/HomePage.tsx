import Hero from '@/components/Hero';

export default function HomePage() {
  return (
    <div className="min-h-screen text-brand-text flex flex-col">
      <main className="flex-1">
        {/* Section 1: Hero Visual and Brand Statement */}
        <Hero />
      </main>
    </div>
  );
}
