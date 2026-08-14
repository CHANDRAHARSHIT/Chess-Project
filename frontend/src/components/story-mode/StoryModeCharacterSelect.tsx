import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';

interface StoryModeCharacterSelectProps {
  onSelect: (characterId: string) => void;
  onClose?: () => void;
}

export default function StoryModeCharacterSelect({ onSelect }: StoryModeCharacterSelectProps) {
  const characters = [
    {
      id: "knight",
      name: "The Knight",
      description: "A versatile warrior, mastering L-shaped ambushes.",
      image: "https://picsum.photos/400/500?random=1",
      locked: false,
    },
    {
      id: "bishop",
      name: "The Bishop",
      description: "Strikes from afar. Unlocked by reaching Floor 10.",
      image: "https://picsum.photos/400/500?random=2",
      locked: true,
    },
    {
      id: "rook",
      name: "The Rook",
      description: "An immovable object. Unlocked by defeating the Dark King.",
      image: "https://picsum.photos/400/500?random=3",
      locked: true,
    },
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-[var(--obsidian-mid)] rounded-2xl border border-[var(--obsidian-light)] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-white/5 text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
            Choose Your Champion
          </h2>
          <p className="text-white/60 mt-2 text-sm sm:text-base">
            Your character determines your playstyle for this run.
          </p>
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {characters.map((char, i) => (
              <motion.div
                key={char.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => !char.locked && onSelect(char.id)}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  char.locked
                    ? 'border-white/5 cursor-not-allowed'
                    : 'border-amber-500/30 cursor-pointer hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                }`}
              >
                <div className="aspect-[3/4] relative bg-black">
                  <img
                    src={char.image}
                    alt={char.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      char.locked ? 'grayscale brightness-0 opacity-40' : 'group-hover:scale-110 opacity-80 group-hover:opacity-100'
                    }`}
                  />
                  
                  {char.locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
                      <Lock className="w-12 h-12 text-white/20 mb-4" />
                      <span className="text-white/40 font-semibold tracking-wider text-sm">LOCKED</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className={`text-xl font-bold mb-2 ${char.locked ? 'text-white/40' : 'text-amber-100'}`}>
                      {char.name}
                    </h3>
                    <p className={`text-sm leading-relaxed ${char.locked ? 'text-white/30' : 'text-white/70'}`}>
                      {char.description}
                    </p>
                    
                    {!char.locked && (
                      <div className="mt-4 flex items-center justify-between text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                        <span className="text-xs font-bold uppercase tracking-wider">Select Champion</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
