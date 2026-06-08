import { Users, ShieldAlert, GraduationCap } from 'lucide-react';

export default function Features() {
  const cards = [
    {
      icon: <Users className="w-6 h-6 text-brand-accent" />,
      title: 'Audience Ownership',
      description: 'Your audience belongs to you, not a third-party platform. Maintain direct, uninterrupted access to your subscribers, email lists, and analytics without being subject to algorithm updates or fee increases.'
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-brand-accent" />,
      title: 'Brand Independence',
      description: 'Establish a premium destination under your own custom domain. Seamlessly configure your logos, colors, and layout settings to ensure your chess brand remains the primary touchpoint for your community.'
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-brand-accent" />,
      title: 'Learning Experience',
      description: 'Deliver instructional chess content through specialized tools. Design custom studies, host private tournaments, assign interactive chess problems, and track student ratings through a unified academic ledger.'
    }
  ];

  return (
    <section id="why-ownership" className="py-20 bg-brand-surface border-y border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Why Ownership Matters
          </h2>
          <p className="font-sans text-brand-secondary text-base leading-relaxed">
            Leading chess educators and creators are moving away from closed ecosystems. 
            ChessCraft provides the infrastructure to build, brand, and scale your digital assets independently.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <div 
              key={i} 
              className="p-8 rounded-xl bg-brand-bg border border-brand-border flex flex-col items-start text-left space-y-4 hover:border-brand-accent/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center group-hover:bg-brand-accent/10 group-hover:border-brand-accent/20 transition-all duration-300">
                {card.icon}
              </div>
              <h3 className="font-sans font-bold text-lg text-white">
                {card.title}
              </h3>
              <p className="font-sans text-sm text-brand-secondary leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
