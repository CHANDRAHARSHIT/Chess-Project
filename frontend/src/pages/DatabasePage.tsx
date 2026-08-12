import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { soundManager } from "@/shared/lib/SoundManager";

const PLAYERS = [
  {
    id: "garry-kasparov",
    name: "Garry Kasparov",
    games: "2,440 Games",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7d7SMuPZgf62uQJKq2GlczhCRMW1dBX1aT5Z1kvhWy9dqYC14IMUpSk0&s=10",
    active: true,
  },
  {
    id: "bobby-fischer",
    name: "Bobby Fischer",
    games: "1,188 Games",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/ec/Bobby_Fischer_1960.jpg",
    active: false,
  },
  {
    id: "magnus-carlsen",
    name: "Magnus Carlsen",
    games: "6,738 Games",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/ea/Magnus_Carlsen_2021.jpg",
    active: false,
  },
  {
    id: "jose-raul-capablanca",
    name: "Jose Raul Capablanca",
    games: "1,310 Games",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/7/75/Jose_Raul_Capablanca_1931.jpg",
    active: false,
  },
  {
    id: "hikaru-nakamura",
    name: "Hikaru Nakamura",
    games: "14,502 Games",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/7/7d/Hikaru_Nakamura_2018.jpg",
    active: false,
  },
  {
    id: "paul-morphy",
    name: "Paul Morphy",
    games: "415 Games",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/6/6f/Paul_Morphy.jpg",
    active: false,
  },
];

export default function DatabasePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans p-6 md:p-10 lg:p-12 overflow-y-auto w-full">
      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-10">
        {/* Left Content Area */}
        <div className="flex-1">
          {/* Back Navigation */}
          <button
            onClick={() => {
              soundManager.playButtonClick();
              navigate("/");
            }}
            className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group mb-6"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="3"
                  width="8"
                  height="8"
                  fill="var(--gold-bright)"
                />
                <rect
                  x="13"
                  y="13"
                  width="8"
                  height="8"
                  fill="var(--gold-bright)"
                />
                <rect
                  x="3"
                  y="13"
                  width="8"
                  height="8"
                  fill="var(--glass-border-gold)"
                />
                <rect
                  x="13"
                  y="3"
                  width="8"
                  height="8"
                  fill="var(--glass-border-gold)"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold font-display tracking-wide text-brand-text">
              Chess Games Database
            </h1>
          </div>

          <p className="text-sm md:text-base text-brand-secondary max-w-3xl mb-8 leading-relaxed">
            Search through millions of top games played by the strongest chess
            players of the past and present. From world chess champions to FIDE
            masters, you will find an enormous collection of games that you can
            search, sort, and download.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-20">
            {PLAYERS.map((player) => (
              <div
                key={player.id}
                onClick={() =>
                  player.active && navigate(`/database/${player.id}`)
                }
                className={`group flex flex-col rounded-xl overflow-hidden bg-brand-surface border border-brand-text/20 transition-all duration-300
                  ${player.active ? "cursor-pointer hover:border-brand-accent hover:-translate-y-1" : "opacity-80 cursor-not-allowed"}
                `}
              >
                <div className="h-48 w-full overflow-hidden relative bg-brand-bg">
                  {player.active ? (
                    <img
                      src={player.image}
                      alt={player.name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-4 py-1.5 bg-brand-surface rounded border border-brand-text/20 text-xs font-semibold tracking-widest uppercase text-brand-secondary">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent h-[76px] flex flex-col justify-center">
                  {player.active ? (
                    <>
                      <h3 className="text-lg font-bold font-display tracking-wide text-brand-accent">
                        {player.name}
                      </h3>
                      <p className="text-xs text-brand-secondary mt-1 tracking-wide">
                        {player.games}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar (Search Panel) */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col items-center gap-6">
          <div className="w-full rounded-xl border border-brand-border bg-brand-surface p-5 opacity-40 pointer-events-none">
            <h2 className="text-lg font-semibold font-display text-brand-text mb-4">
              Games
            </h2>
            <p className="text-xs text-brand-secondary mb-3">
              Select an opening or player to search
            </p>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary" />
                <input
                  type="text"
                  placeholder="Opening"
                  className="w-full bg-brand-surface border border-brand-border/60 rounded-lg py-2 pl-9 pr-4 text-sm text-brand-text focus:outline-none focus:border-brand-accent/50 transition-colors"
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary" />
                <input
                  type="text"
                  placeholder="Player 1"
                  className="w-full bg-brand-surface border border-brand-border/60 rounded-lg py-2 pl-9 pr-4 text-sm text-brand-text focus:outline-none focus:border-brand-accent/50 transition-colors"
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary" />
                <input
                  type="text"
                  placeholder="Player 2"
                  className="w-full bg-brand-surface border border-brand-border/60 rounded-lg py-2 pl-9 pr-4 text-sm text-brand-text focus:outline-none focus:border-brand-accent/50 transition-colors"
                />
              </div>

              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-brand-border/60 bg-brand-surface text-brand-accent focus:ring-0 w-4 h-4"
                />
                <span className="text-xs text-brand-secondary">
                  Fixed Colors
                </span>
              </label>

              <div className="pt-4 flex items-center justify-between">
                <button className="px-6 py-2 bg-[#7FA650] hover:bg-[#8CB758] text-white font-bold rounded-lg text-sm transition-colors">
                  Search
                </button>
                <button className="text-xs text-brand-secondary hover:text-brand-text flex items-center gap-1 transition-colors">
                  Advanced <ChevronDownIcon />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-brand-surface px-6 py-2.5 rounded-lg border border-brand-border/40 text-brand-accent font-semibold">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
