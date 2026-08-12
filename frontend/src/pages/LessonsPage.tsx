import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpen,
  Play,
  Lock,
  Clock,
  Sparkles,
  Award,
  Layers,
  Search,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';

interface Lesson {
  id: string;
  title: string;
  category: string;
  description: string;
  instructor: string;
  level: string;
  duration: string;
  segmentsCount: number;
  thumbnailUrl: string;
  isAvailable: boolean;
  badge?: string;
}

const CATEGORIES = [
  'All',
  'Fundamentals',
  'Openings',
  'Tactics',
  'Endgame',
  'Strategy',
];

const LESSONS: Lesson[] = [
  {
    id: 'chess-fundamentals',
    title: 'Mastering Chess Fundamentals: Opening & Tactics',
    category: 'Fundamentals',
    description:
      'Learn key principles of board control, piece coordination, tactical traps, and endgame fundamentals step-by-step.',
    instructor: 'GM Alexandra Kosteniuk',
    level: 'Beginner - Intermediate',
    duration: '25 min',
    segmentsCount: 4,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    badge: 'Popular',
  },
  {
    id: 'pawn-structures-mastery',
    title: 'Advanced Pawn Structures & Weaknesses',
    category: 'Strategy',
    description:
      'Understand isolated pawns, doubled pawns, pawn chains, and how to create winning pawn breaks in the middlegame.',
    instructor: 'IM Daniel Rensch',
    level: 'Intermediate',
    duration: '40 min',
    segmentsCount: 5,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=800&q=80',
    isAvailable: false,
  },
  {
    id: 'middlegame-attacks',
    title: 'Middlegame Masterclass: Kingside Attack Planning',
    category: 'Strategy',
    description:
      'Discover dynamic piece maneuvers, sacrifices, and piece coordination strategies to launch decisive attacks.',
    instructor: 'GM Hikaru Nakamura',
    level: 'Advanced',
    duration: '35 min',
    segmentsCount: 4,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    isAvailable: false,
  },
  {
    id: 'endgame-essentials',
    title: 'Endgame Essentials: King & Pawn Mastery',
    category: 'Endgame',
    description:
      'Master opposition, key squares, triangulation, and theoretical pawn endgames essential for securing victories.',
    instructor: 'GM Peter Svidler',
    level: 'All Levels',
    duration: '30 min',
    segmentsCount: 4,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=800&q=80',
    isAvailable: false,
  },
  {
    id: 'tactical-pattern-recognition',
    title: 'Tactical Calculation & Pattern Recognition',
    category: 'Tactics',
    description:
      'Train your brain to instantly spot pins, forks, skewers, deflectors, and multi-move tactical combinations.',
    instructor: 'WGM Anna Cramling',
    level: 'Beginner',
    duration: '20 min',
    segmentsCount: 3,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
    isAvailable: false,
  },
  {
    id: 'gm-opening-preparation',
    title: 'Grandmaster Opening Repertoires & Mainlines',
    category: 'Openings',
    description:
      'Dive deep into modern opening ideas for White & Black with grandmaster concepts and tactical traps.',
    instructor: 'GM Viswanathan Anand',
    level: 'Advanced',
    duration: '45 min',
    segmentsCount: 6,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&w=800&q=80',
    isAvailable: false,
  },
];

export default function LessonsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLessons = LESSONS.filter((lesson) => {
    const matchesCategory =
      selectedCategory === 'All' || lesson.category === selectedCategory;
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Back Navigation */}
      <div>
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

      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-surface via-brand-surface/90 to-brand-bg border border-brand-border p-6 sm:p-8 lg:p-10">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-brand-accent/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Learning Feed</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-brand-text tracking-tight">
            Lesson Library
          </h1>
          <p className="text-sm sm:text-base text-brand-secondary leading-relaxed">
            Level up your game with step-by-step interactive lessons. Watch, practice concepts, and unlock new segments as you progress.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-brand-secondary">
            <div className="flex items-center gap-1.5 bg-brand-bg/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-brand-border/40">
              <BookOpen className="w-4 h-4 text-brand-accent" />
              <span>Multi-Segment Courses</span>
            </div>
            <div className="flex items-center gap-1.5 bg-brand-bg/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-brand-border/40">
              <Award className="w-4 h-4 text-brand-accent" />
              <span>Interactive Progression</span>
            </div>
            <div className="flex items-center gap-1.5 bg-brand-bg/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-brand-border/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Self-Paced Learning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Category Pills (YouTube Feed Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === category
                  ? 'bg-brand-accent text-brand-bg'
                  : 'bg-brand-bg text-brand-secondary hover:text-brand-text border border-brand-border/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lessons..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm font-sans rounded-xl outline-none transition-all duration-200 placeholder:text-brand-secondary/40 bg-brand-surface/60 border border-brand-border text-brand-text focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/30"
          />
        </div>
      </div>

      {/* Lessons Grid (YT Feed Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLessons.map((lesson) => {
          return (
            <div
              key={lesson.id}
              onClick={() => {
                if (lesson.isAvailable) {
                  navigate(`/lessons/${lesson.id}`);
                }
              }}
              className={`group relative flex flex-col rounded-2xl overflow-hidden bg-brand-surface/70 border border-brand-border transition-all duration-300 ${
                lesson.isAvailable
                  ? 'hover:border-brand-accent/50 hover:-translate-y-1 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-brand-bg">
                <img
                  src={lesson.thumbnailUrl}
                  alt={lesson.title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    lesson.isAvailable ? 'group-hover:scale-105' : 'filter blur-[1px]'
                  }`}
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent opacity-80" />

                {/* Duration Tag */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium">
                  <Clock className="w-3 h-3 text-brand-accent" />
                  <span>{lesson.duration}</span>
                </div>

                {/* Segments Tag */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium">
                  <Layers className="w-3 h-3 text-brand-accent" />
                  <span>{lesson.segmentsCount} Segments</span>
                </div>

                {/* Badge if available */}
                {lesson.badge && lesson.isAvailable && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-brand-accent text-brand-bg text-[10px] font-bold uppercase tracking-wider">
                    {lesson.badge}
                  </div>
                )}

                {/* Play Icon Hover Overlay for Available Lesson */}
                {lesson.isAvailable ? (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-[2px]">
                    <div className="w-14 h-14 rounded-full bg-brand-accent text-brand-bg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                  </div>
                ) : (
                  /* Coming Soon Banner Overlay for Locked Lessons */
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 text-center">
                    <div className="p-3 rounded-full bg-brand-surface/80 border border-brand-border/60 text-brand-secondary mb-2">
                      <Lock className="w-6 h-6 text-amber-400" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-widest">
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-brand-secondary font-medium">
                    <span className="text-brand-accent">{lesson.category}</span>
                    <span>{lesson.level}</span>
                  </div>

                  <h3 className={`font-display font-bold text-lg leading-snug transition-colors ${
                    lesson.isAvailable ? 'text-brand-text group-hover:text-brand-accent' : 'text-brand-text/70'
                  }`}>
                    {lesson.title}
                  </h3>

                  <p className="text-xs text-brand-secondary line-clamp-2 leading-relaxed">
                    {lesson.description}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-brand-border/40 flex items-center justify-between text-xs font-medium">
                  <span className="text-brand-secondary/80">
                    By <strong className="text-brand-text">{lesson.instructor}</strong>
                  </span>

                  {lesson.isAvailable ? (
                    <span className="inline-flex items-center gap-1 text-brand-accent group-hover:translate-x-1 transition-transform">
                      Start Lesson &rarr;
                    </span>
                  ) : (
                    <span className="text-amber-400/80 text-[11px] font-semibold uppercase tracking-wider">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
