import { useState } from "react";
import { useNavigate } from "react-router";
import { 
  Play, 
  Shuffle, 
  Trash2, 
  GripVertical, 
  BookOpen, 
  Puzzle, 
  Swords,
  MoreVertical,
  Clock,
  ArrowLeft
} from "lucide-react";
import { soundManager } from "@/shared/lib/SoundManager";

type QueueItemType = "Lesson" | "Puzzle" | "Game";

interface QueueItem {
  id: string;
  type: QueueItemType;
  title: string;
  author: string;
  addedAt: string;
  duration?: string;
}

const initialMockData: QueueItem[] = [
  {
    id: "1",
    type: "Lesson",
    title: "Mastering the Sicilian Defense",
    author: "GM Hikaru Nakamura",
    addedAt: "Added today",
    duration: "15:20"
  },
  {
    id: "2",
    type: "Puzzle",
    title: "Mate in 3: Daily Puzzle",
    author: "XLChess Tactics",
    addedAt: "Added yesterday"
  },
  {
    id: "3",
    type: "Game",
    title: "Magnus Carlsen vs. Fabiano Caruana (2018)",
    author: "World Championship",
    addedAt: "Added 3 days ago",
    duration: "45 moves"
  },
  {
    id: "4",
    type: "Lesson",
    title: "Endgame Principles: King and Pawn",
    author: "IM Levy Rozman",
    addedAt: "Added last week",
    duration: "22:15"
  },
  {
    id: "5",
    type: "Puzzle",
    title: "Pin and Win: Advanced Tactics",
    author: "XLChess Tactics",
    addedAt: "Added last week"
  }
];

export default function CompleteLaterPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<QueueItem[]>(initialMockData);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleRemove = (id: string) => {
    soundManager.playButtonClick();
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const reorder = (from: number, to: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(from, 1);
      copy.splice(to, 0, removed);
      return copy;
    });
    // Haptic feedback for mobile if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // PC HTML5 Drag
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    reorder(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Mobile Touch Drag
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (draggedIndex === null) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropItem = target?.closest('[data-index]');
    
    if (dropItem) {
      const dropIdx = parseInt(dropItem.getAttribute('data-index') || '-1', 10);
      if (dropIdx !== -1 && dropIdx !== draggedIndex) {
        reorder(draggedIndex, dropIdx);
        setDraggedIndex(dropIdx);
      }
    }
  };

  const getIconForType = (type: QueueItemType) => {
    switch (type) {
      case "Lesson": return <BookOpen className="w-6 h-6 text-brand-bg" />;
      case "Puzzle": return <Puzzle className="w-6 h-6 text-brand-bg" />;
      case "Game": return <Swords className="w-6 h-6 text-brand-bg" />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-bg flex justify-center px-2.5 py-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] w-full flex flex-col">
        
        <button
          type="button"
          onClick={() => {
            soundManager.playButtonClick();
            navigate("/");
          }}
          className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group mb-4 lg:mb-6 w-fit"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Left Sidebar / Header Container */}
          <div className="w-full lg:w-[360px] lg:sticky top-8 flex-shrink-0">
            <div 
              className="w-full relative luxury-card"
              style={{ borderRadius: '0.75rem' }}
            >
            {/* Background Blur Overlay for aesthetics */}
            <div 
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                backgroundImage: "url('/logo.webp')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(20px)"
              }}
            />
            
            <div className="relative z-10 p-4 sm:p-6 flex flex-col md:flex-row lg:flex-col items-start gap-4 md:gap-6 lg:gap-0 h-full text-left">
              {/* Cover Image Placeholder */}
              <div className="w-full md:w-64 lg:w-full shrink-0 aspect-video rounded-lg lg:mb-6 flex flex-col items-center justify-center bg-brand-bg/60 backdrop-blur-md border border-brand-accent/20 relative overflow-hidden">
                <Clock className="w-10 h-10 md:w-12 md:h-12 text-brand-secondary mb-2 opacity-50" />
                <span className="text-brand-secondary font-semibold tracking-widest uppercase text-xs md:text-sm opacity-80">Coming Soon</span>
              </div>

              <div className="flex-1 flex flex-col w-full items-start">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-brand-text mb-1 md:mb-2 tracking-tight">Complete Later</h1>
                <p className="text-brand-text/90 font-medium mb-1">XLChess User</p>
                
                <div className="flex items-center text-xs text-brand-secondary mb-4 lg:mb-6 gap-2 font-sans">
                  <span>{items.length} items</span>
                  <span>•</span>
                  <span>Updated today</span>
                </div>

                <div className="flex items-center gap-3 mt-auto w-full overflow-hidden">
                  <button 
                    disabled
                    title="Coming Soon"
                    className="flex-1 whitespace-nowrap bg-brand-text/30 text-brand-bg/50 cursor-not-allowed py-2 md:py-2.5 px-4 rounded-full font-semibold flex items-center justify-center gap-1.5 md:gap-2 group text-sm md:text-base"
                  >
                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-current opacity-50 shrink-0" /> Play All
                  </button>
                  <button 
                    disabled
                    title="Coming Soon"
                    className="flex-1 whitespace-nowrap bg-white/5 text-brand-text/30 cursor-not-allowed py-2 md:py-2.5 px-4 rounded-full font-semibold flex items-center justify-center gap-1.5 md:gap-2 text-sm md:text-base"
                  >
                    <Shuffle className="w-4 h-4 md:w-5 md:h-5 opacity-50 shrink-0" /> Shuffle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right List Section */}
        <div className="flex-1 flex flex-col gap-2 font-sans">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-brand-secondary">
              <BookOpen className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg">No items in your queue.</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div 
                key={item.id} 
                data-index={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={handleDragEnd}
                className={`group flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl transition-colors cursor-pointer border border-transparent relative
                  ${draggedIndex === index ? 'opacity-40 bg-brand-accent/10 border-brand-accent/30' : 'hover:bg-brand-surface/60 hover:border-brand-border'}
                `}
              >
                {/* Drag Handle & Index */}
                <div 
                  className="flex items-center gap-2 w-6 sm:w-8 shrink-0 text-brand-secondary cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'none' }}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleDragEnd}
                  onTouchCancel={handleDragEnd}
                >
                  <span className="hidden sm:block group-hover:hidden w-4 text-center">{index + 1}</span>
                  <GripVertical className="w-5 h-5 sm:w-4 sm:h-4 sm:hidden group-hover:block text-brand-secondary" />
                </div>

                {/* Thumbnail */}
                <div className="relative w-28 sm:w-40 aspect-video rounded-lg overflow-hidden shrink-0 bg-brand-accent flex items-center justify-center">
                  {getIconForType(item.type)}
                  
                  {/* Duration Badge */}
                  {item.duration && (
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded">
                      {item.duration}
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div 
                    title="Coming Soon"
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] cursor-not-allowed"
                  >
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white/50 fill-white/50" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="text-sm sm:text-base font-semibold text-brand-text truncate group-hover:text-brand-accent transition-colors leading-tight sm:leading-normal">
                    {item.title}
                  </h3>
                  <div className="text-xs sm:text-sm text-brand-secondary mt-1 flex items-center gap-1 sm:gap-2 truncate">
                    <span className="truncate">{item.author}</span>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider px-1 sm:px-1.5 py-0.5 rounded-sm bg-white/10 font-bold shrink-0">
                      {item.type}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    className="p-1.5 sm:p-2 text-brand-secondary hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                    aria-label="Remove from Complete Later"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button 
                    disabled
                    title="Coming Soon"
                    className="p-1.5 sm:p-2 text-brand-secondary/50 cursor-not-allowed rounded-full transition-colors hidden sm:block"
                  >
                    <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
