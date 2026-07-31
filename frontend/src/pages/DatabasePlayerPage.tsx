import { useState, useMemo } from "react";
import { Search, ChevronDown, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import { ThemedChessboard } from "../components/ThemedChessboard";
import { MOCK_GAMES } from "../data/mockGames";

export default function DatabasePlayerPage() {
  const navigate = useNavigate();
  const [hoveredGame, setHoveredGame] = useState<any>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [sortOption, setSortOption] = useState("year-desc");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const sortedGames = useMemo(() => {
    return [...MOCK_GAMES].sort((a, b) => {
      if (sortOption === "year-desc") return b.year - a.year;
      if (sortOption === "year-asc") return a.year - b.year;
      if (sortOption === "moves-desc") return b.moves - a.moves;
      if (sortOption === "moves-asc") return a.moves - b.moves;
      return 0;
    });
  }, [sortOption]);

  const handleMouseEnter = (e: React.MouseEvent, game: any) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverPos({
      top: rect.top + window.scrollY - 100,
      left: rect.right + 20,
    });
    setHoveredGame(game);
  };

  const handleMouseLeave = () => {
    setHoveredGame(null);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans p-6 md:p-10 lg:p-12 overflow-y-auto w-full relative">
      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-10">
        
        {/* Left Content Area (Player Details) */}
        <div className="flex-1 w-full">
          {/* Header Profile */}
          <div className="flex flex-col md:flex-row gap-6 mb-10 items-center md:items-start">
            
            {/* Mobile Title */}
            <div className="flex md:hidden items-center gap-3 w-full justify-center">
              <span className="bg-red-600 text-brand-text font-bold px-1.5 py-0.5 rounded text-xs">GM</span>
              <h1 className="text-3xl font-display font-semibold text-center">Garry Kasparov</h1>
            </div>

            <div className="w-56 h-64 md:w-40 md:h-48 rounded-lg overflow-hidden border border-brand-border/40 shrink-0">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Garri_Kasparow_%2818776605665%29_%28cropped%29_2.jpg/500px-Garri_Kasparow_%2818776605665%29_%28cropped%29_2.jpg" 
                alt="Garry Kasparov"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex flex-col justify-center w-full">
              {/* Desktop Title */}
              <div className="hidden md:flex items-center gap-3 mb-2">
                <span className="bg-red-600 text-brand-text font-bold px-1.5 py-0.5 rounded text-xs">GM</span>
                <h1 className="text-3xl font-display font-semibold">Garry Kasparov</h1>
              </div>
              
              <table className="text-sm text-brand-secondary border-separate border-spacing-y-1 w-full md:w-auto mt-4 md:mt-0">
                <tbody>
                  <tr>
                    <td className="font-semibold text-brand-accent pr-4">Full name</td>
                    <td>Garry Kimovich Kasparov</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-brand-accent pr-4">Born</td>
                    <td>Apr 13, 1963 (age 63)</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-brand-accent pr-4">Place of birth</td>
                    <td>Baku, Azerbaijan SSR, Soviet Union</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-brand-accent pr-4">Federation</td>
                    <td>Russia</td>
                  </tr>
                </tbody>
              </table>

            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4 mb-10">
            <StatBar label="Total Games 2439" win={49} draw={41} loss={10} />
            <StatBar label="As White 1355" win={59} draw={35} loss={6} />
            <StatBar label="As Black 1084" win={37} draw={50} loss={13} />
          </div>

          {/* Games List */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-brand-border/40 pb-2">
              <h2 className="text-xl font-display font-semibold text-brand-text">Garry Kasparov Chess Games</h2>
              <div className="relative">
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="text-sm text-brand-secondary hover:text-brand-accent flex items-center gap-1 transition-colors font-sans"
                >
                  {sortOption === "year-desc" ? "Year (Most Recent)" : sortOption === "year-asc" ? "Year (Oldest)" : sortOption === "moves-desc" ? "Moves (Most)" : "Moves (Least)"} <ChevronDown className="w-4 h-4" />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 top-6 w-48 bg-brand-surface border border-brand-border/40 rounded shadow-2xl z-50 overflow-hidden font-sans">
                    {[
                      { value: "year-desc", label: "Year (Most Recent)" },
                      { value: "year-asc", label: "Year (Oldest)" },
                      { value: "moves-desc", label: "Moves (Most)" },
                      { value: "moves-asc", label: "Moves (Least)" }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortOption(option.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${sortOption === option.value ? 'bg-brand-accent/20 text-brand-accent' : 'text-brand-secondary hover:bg-brand-text/5 hover:text-brand-text'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="text-brand-secondary text-xs uppercase tracking-wider">
                <tr>
                  <th className="pb-3 font-normal w-1/2">Players</th>
                  <th className="pb-3 font-normal text-center">Result</th>
                  <th className="pb-3 font-normal text-center">Moves</th>
                  <th className="pb-3 font-normal hidden md:table-cell text-center">Year</th>
                </tr>
              </thead>
              <tbody className="text-brand-text divide-y divide-brand-border/20">
                {sortedGames.map((game) => (
                  <tr 
                    key={game.id} 
                    className="transition-colors hover:bg-brand-accent/5 cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(e, game)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => navigate(`/database/game/${game.id}`)}
                  >
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{game.white}</span>
                        <span>{game.black}</span>
                        <div className="flex items-center text-xs text-brand-secondary mt-1">
                          <span className="truncate">{game.pgn.split(" 4. ")[0]}</span>
                          <span className="mx-1.5 opacity-50 shrink-0">|</span>
                          <span className="text-brand-accent shrink-0">{game.opening}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-brand-accent text-center">{game.result}</td>
                    <td className="py-3 text-brand-secondary text-center">{game.moves}</td>
                    <td className="py-3 text-brand-secondary hidden md:table-cell text-center">{game.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar (Search Panel - Duplicate from DatabasePage) */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col items-center gap-6">
          <div className="w-full rounded-xl border border-brand-border bg-brand-surface p-5 shadow-2xl opacity-40 pointer-events-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-display text-brand-text">Games</h2>
              <ChevronDown className="w-4 h-4 text-brand-secondary" />
            </div>
            <p className="text-xs text-brand-secondary mb-3">Select an opening or player to search</p>
            
            <div className="space-y-3">
              <div className="relative flex items-center gap-2 bg-brand-surface border border-brand-border/60 rounded-lg pr-2 focus-within:border-brand-accent/50 transition-colors">
                <Search className="ml-3 w-4 h-4 text-brand-secondary" />
                <input 
                  type="text" 
                  placeholder="Opening"
                  className="w-full bg-transparent py-2 text-sm text-brand-text focus:outline-none"
                />
              </div>
              
              <div className="relative flex items-center gap-2 bg-brand-surface border border-brand-border/60 rounded-lg pr-2 focus-within:border-brand-accent/50 transition-colors">
                <Search className="ml-3 w-4 h-4 text-brand-secondary" />
                <input 
                  type="text" 
                  placeholder="Garry Kasparov"
                  className="w-full bg-transparent py-2 text-sm text-brand-text focus:outline-none"
                  readOnly
                />
                <button className="text-brand-secondary hover:text-brand-text"><Settings className="w-3 h-3"/></button>
              </div>

              <div className="relative flex items-center gap-2 bg-brand-surface border border-brand-border/60 rounded-lg pr-2 focus-within:border-brand-accent/50 transition-colors">
                <Search className="ml-3 w-4 h-4 text-brand-secondary" />
                <input 
                  type="text" 
                  placeholder="Player 2"
                  className="w-full bg-transparent py-2 text-sm text-brand-text focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" className="rounded border-brand-border/60 bg-brand-surface text-brand-accent focus:ring-0 w-4 h-4" />
                <span className="text-xs text-brand-secondary">Fixed Colors</span>
              </label>

              <div className="pt-4 flex items-center justify-between">
                <button className="px-6 py-2 bg-[#7FA650] hover:bg-[#8CB758] text-white font-bold rounded-lg text-sm shadow-lg transition-colors">
                  Search
                </button>
                <button className="text-xs text-brand-secondary hover:text-brand-text flex items-center gap-1 transition-colors">
                  Advanced <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-brand-surface px-6 py-2.5 rounded-lg border border-brand-border/40 text-brand-accent font-semibold shadow-xl">
            Coming Soon
          </div>
        </div>

      </div>

      {/* Hover Chessboard Popover */}
      {hoveredGame && (
        <div 
          className="fixed z-50 p-2 bg-brand-bg rounded-lg border border-brand-border/60 shadow-2xl pointer-events-none transition-opacity duration-200"
          style={{ top: popoverPos.top, left: popoverPos.left, width: 240, height: 240 }}
        >
          <ThemedChessboard 
            options={{ 
              position: hoveredGame.fen,
              showNotation: false
            }} 
          />
        </div>
      )}
    </div>
  );
}

// Progress Bar Helper
function StatBar({ label, win, draw, loss }: { label: string, win: number, draw: number, loss: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-bold text-brand-text mb-1.5">
        <span>{label}</span>
      </div>
      <div className="w-full h-5 flex overflow-hidden text-xs font-bold text-white text-center">
        <div style={{ width: `${win}%`, minWidth: win > 0 ? '80px' : undefined }} className="bg-[#7FA650] flex items-center justify-center border-r border-brand-bg/50 relative">
          <span className="whitespace-nowrap z-10 drop-shadow-sm">{win > 0 ? `${win}% Win` : ''}</span>
        </div>
        <div style={{ width: `${draw}%`, minWidth: draw > 0 ? '80px' : undefined }} className="bg-[#8E8B82] flex items-center justify-center border-r border-brand-bg/50 relative">
          <span className="whitespace-nowrap z-10 drop-shadow-sm">{draw > 0 ? `${draw}% Draw` : ''}</span>
        </div>
        <div style={{ width: `${loss}%`, minWidth: loss > 0 ? '80px' : undefined }} className="bg-[#B95147] flex items-center justify-center relative">
          <span className="whitespace-nowrap z-10 drop-shadow-sm">{loss > 0 ? `${loss}% Loss` : ''}</span>
        </div>
      </div>
    </div>
  );
}
