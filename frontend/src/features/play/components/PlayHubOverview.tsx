/**
 * PlayHubOverview.tsx
 *
 * The main overview/landing view for the Play Hub (/play).
 * Features:
 * - Desktop: 2-column layout with Themed chessboard on the left and "Play Chess" options on the right.
 * - Mobile: Chessboard is hidden, showing the clean "Play Chess" action cards directly.
 * - Dynamic BoardCoordinates with theme-adaptive colors.
 * - Non-playable starting chessboard.
 * - Disabled cards strictly do not respond to hover (no text gold / icon scale).
 * - Bottom 3-item section matching the attached design: Game History | Leaderboard | Stats.
 */
import { Link } from "react-router";
import { ThemedChessboard } from "@/shared/ui/ThemedChessboard";
import { BoardCoordinates } from "@/shared/ui/BoardCoordinates";
import { useSession } from "@/features/account/useSession";
import { useBoardSettings } from "@/shared/appearance/useBoardSettings";
import { soundManager } from "@/shared/lib/SoundManager";
import { featureFlags } from "@/shared/lib/featureFlags";
import {
  Swords,
  History,
  Trophy,
  BarChart3,
  ChevronRight,
  User,
  Lock,
} from "lucide-react";

interface PlayHubOverviewProps {
  onSelectTab: (tab: "online" | "bots" | "variants") => void;
  onNavigateOnlineSection: (sectionId: "recent-games" | "leaderboard") => void;
}

interface ModeCardConfig {
  id: string;
  title: string;
  subtitle: string;
  iconType: "image" | "lucide";
  iconSrc?: string;
  IconComponent?: React.ElementType;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function PlayHubOverview({
  onSelectTab,
  onNavigateOnlineSection,
}: PlayHubOverviewProps) {
  const { session } = useSession();
  const { boardTheme } = useBoardSettings();

  // ── Mode Cards Configuration ────────────────────────────────────────────────
  const modeCards: ModeCardConfig[] = [
    {
      id: "quick-game",
      title: "Quick Game",
      subtitle: "Jump straight into a game with a matched opponent.",
      iconType: "image",
      iconSrc: "/assets/PlayIcons/quick-game-icon.png",
      disabled: !featureFlags.enablePlayOnline,
      comingSoon: !featureFlags.enablePlayOnline,
      onClick: () => {
        if (!featureFlags.enablePlayOnline) return;
        soundManager.playButtonClick();
        onSelectTab("online");
      },
    },
    {
      id: "odyssey",
      title: "Odyssey",
      subtitle: "Master chess through an epic adventure.",
      iconType: "lucide",
      IconComponent: Swords,
      href: "/odyssey",
      disabled: !featureFlags.showOdyssey,
      comingSoon: !featureFlags.showOdyssey,
    },
    {
      id: "bots",
      title: "Bots",
      subtitle: "Challenge bots from beginner to master.",
      iconType: "image",
      iconSrc: "/assets/PlayIcons/bot-icon.png",
      onClick: () => {
        soundManager.playButtonClick();
        onSelectTab("bots");
      },
    },
    {
      id: "coach",
      title: "Coach",
      subtitle: "Learn and improve while you play.",
      iconType: "image",
      iconSrc: "/assets/PlayIcons/coach-icon.png",
      disabled: true,
      comingSoon: true,
    },
    {
      id: "friend",
      title: "Play a Friend",
      subtitle: "Invite a friend and play together.",
      iconType: "image",
      iconSrc: "/assets/PlayIcons/friend-icon.png",
      disabled: true,
      comingSoon: true,
    },
    {
      id: "tournaments",
      title: "Tournaments",
      subtitle: "Compete against players and climb the standings.",
      iconType: "image",
      iconSrc: "/assets/PlayIcons/tournament-icon.png",
      disabled: true,
      comingSoon: true,
    },
    {
      id: "variants",
      title: "Variants",
      subtitle: "Discover fun new ways to play chess.",
      iconType: "image",
      iconSrc: "/assets/PlayIcons/variants-icon.png",
      onClick: () => {
        soundManager.playButtonClick();
        onSelectTab("variants");
      },
    },
  ];

  const userName =
    session?.user?.name ||
    (session?.user?.email ? session.user.email.split("@")[0] : "You");
  const userImage = session?.user?.image;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 select-none animate-fade-in space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ── Left Column: Chess Board with Players Identity (Hidden on Mobile) ── */}
        <div className="hidden lg:flex lg:col-span-7 flex-col items-center justify-center w-full">
          <div className="w-full max-w-[560px] space-y-2.5">
            {/* Opponent Profile Bar */}
            <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 rounded-2xl bg-brand-surface border border-brand-text/15">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-brand-text/15 shrink-0"
                  style={{ background: boardTheme.dark }}
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-brand-secondary" />
                </div>
                <div className="min-w-0">
                  <div className="font-sans font-semibold text-sm sm:text-base text-brand-text truncate">
                    Opponent
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-brand-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chessboard Card - rounded-sm, non-playable, dynamic BoardCoordinates */}
            <div className="relative rounded-sm overflow-hidden border border-brand-text/15 bg-brand-surface p-1 pointer-events-none cursor-default select-none">
              <div className="relative aspect-square w-full rounded-sm overflow-hidden pointer-events-none cursor-default">
                <ThemedChessboard
                  options={{
                    position: STARTING_FEN,
                    showNotation: false,
                    allowDragging: false,
                  }}
                />
                <BoardCoordinates boardOrientation="white" />
              </div>
            </div>

            {/* User Profile Bar */}
            <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 rounded-2xl bg-brand-surface border border-brand-text/15">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center border border-brand-accent/40 shrink-0 relative"
                  style={{ background: boardTheme.light }}
                >
                  {userImage ? (
                    <img
                      src={userImage}
                      alt={userName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="font-mono font-bold text-xs sm:text-sm text-brand-surface">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-sans font-semibold text-sm sm:text-base text-brand-text">
                    {userName}
                  </div>
                  <div className="font-mono text-[11px] text-brand-secondary">
                    {session ? "Online" : "Guest Player"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-brand-accent/15 border border-brand-accent/30 font-mono text-[11px] font-bold text-brand-accent">
                  WHITE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: "Play Chess" Panel (Full Width on Mobile) ── */}
        <div className="w-full lg:col-span-5">
          <div className="rounded-3xl border border-brand-text/15 bg-brand-surface p-4 sm:p-6 flex flex-col justify-between space-y-4">
            {/* Panel Header */}
            <div className="flex items-center gap-3 border-b border-brand-text/10 pb-3">
              <img
                src="/play icon.png"
                alt="Play Chess"
                className="size-12 sm:size-14 object-contain shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-brand-text tracking-tight">
                Play Chess
              </h1>
            </div>

            {/* Mode Action Cards List */}
            <div className="space-y-2.5">
              {modeCards.map((card) => {
                const isCardDisabled = Boolean(card.disabled);

                const content = (
                  <div className="flex items-center gap-3.5 w-full">
                    {/* Large Direct Icon */}
                    <div className="shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14">
                      {card.iconType === "image" && card.iconSrc ? (
                        <img
                          src={card.iconSrc}
                          alt={card.title}
                          className={`w-12 h-12 sm:w-14 sm:h-14 object-contain ${
                            !isCardDisabled
                              ? "transition-transform duration-200 group-hover:scale-105"
                              : ""
                          }`}
                        />
                      ) : card.IconComponent ? (
                        <card.IconComponent
                          className={`w-9 h-9 sm:w-11 sm:h-11 text-brand-accent ${
                            !isCardDisabled
                              ? "transition-transform duration-200 group-hover:scale-105"
                              : ""
                          }`}
                        />
                      ) : null}
                    </div>

                    {/* Mode Texts */}
                    <div className="flex-1 min-w-0 text-left">
                      <div
                        className={`font-sans font-bold text-sm sm:text-base text-brand-text tracking-tight flex items-center gap-2 ${
                          !isCardDisabled
                            ? "group-hover:text-brand-accent transition-colors"
                            : ""
                        }`}
                      >
                        <span>{card.title}</span>
                        {card.comingSoon && (
                          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-brand-text/10 text-brand-secondary border border-brand-text/10 shrink-0">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-xs text-brand-secondary leading-snug mt-0.5">
                        {card.subtitle}
                      </p>
                    </div>

                    {/* Disabled Lock Indicator */}
                    {isCardDisabled && (
                      <Lock className="w-4 h-4 text-brand-secondary/40 shrink-0" />
                    )}
                  </div>
                );

                const cardClass = isCardDisabled
                  ? "w-full p-2.5 sm:p-3 rounded-2xl border bg-brand-surface border-brand-text/10 opacity-50 cursor-not-allowed flex items-center text-left select-none"
                  : "group w-full p-2.5 sm:p-3 rounded-2xl border bg-brand-surface border-brand-text/15 hover:border-brand-accent/50 cursor-pointer active:scale-[0.99] transition-all duration-300 flex items-center text-left";

                if (card.href && !isCardDisabled) {
                  return (
                    <Link
                      key={card.id}
                      to={card.href}
                      onClick={() => soundManager.playButtonClick()}
                      className={cardClass}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={card.id}
                    onClick={card.onClick}
                    disabled={isCardDisabled}
                    className={cardClass}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Game History | Leaderboard | Stats ── */}
      <div className="rounded-3xl border border-brand-text/15 bg-brand-surface overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-brand-text/10">
          {/* 1. Game History */}
          <button
            onClick={() => {
              if (!featureFlags.enablePlayOnline) return;
              soundManager.playButtonClick();
              onNavigateOnlineSection("recent-games");
            }}
            disabled={!featureFlags.enablePlayOnline}
            className={`p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-colors ${
              featureFlags.enablePlayOnline
                ? "group hover:bg-brand-text/5 cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }`}
            title={
              !featureFlags.enablePlayOnline
                ? "Online features coming soon"
                : undefined
            }
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <History className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <div className="font-sans font-bold text-sm sm:text-base text-brand-text truncate group-hover:text-brand-accent transition-colors">
                  Game History
                </div>
                <p className="font-sans text-xs text-brand-secondary mt-0.5">
                  Review your past games
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-brand-secondary shrink-0 group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 2. Leaderboard */}
          <button
            onClick={() => {
              if (!featureFlags.enablePlayOnline) return;
              soundManager.playButtonClick();
              onNavigateOnlineSection("leaderboard");
            }}
            disabled={!featureFlags.enablePlayOnline}
            className={`p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-colors ${
              featureFlags.enablePlayOnline
                ? "group hover:bg-brand-text/5 cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }`}
            title={
              !featureFlags.enablePlayOnline
                ? "Online features coming soon"
                : undefined
            }
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <div className="font-sans font-bold text-sm sm:text-base text-brand-text truncate group-hover:text-brand-accent transition-colors">
                  Leaderboard
                </div>
                <p className="font-sans text-xs text-brand-secondary mt-0.5">
                  See how you rank and compare
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-brand-secondary shrink-0 group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 3. Stats */}
          <Link
            to="/stats"
            onClick={() => soundManager.playButtonClick()}
            className="p-4 sm:p-5 flex items-center justify-between gap-4 text-left group hover:bg-brand-text/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="font-sans font-bold text-sm sm:text-base text-brand-text truncate group-hover:text-brand-accent transition-colors">
                  Stats
                </div>
                <p className="font-sans text-xs text-brand-secondary mt-0.5">
                  Track your progress
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-brand-secondary shrink-0 group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
