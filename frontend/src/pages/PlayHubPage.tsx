/**
 * PlayHubPage.tsx
 *
 * Unified Play Hub. Hosts the main Play Hub overview as well as sub-modes:
 * - Quick Game (/play?tab=online)
 * - Bots (/play?tab=bots, alias: /play?tab=quick)
 * - Variants (/play?tab=variants)
 * - Maia (/play?tab=maia)
 *
 * When on /play (no tab param), renders the 2-column Play Hub Overview.
 * Key invariants enforced here:
 * 1. Default route /play renders the Play Hub Overview.
 * 2. PlayOnlineView is gated behind ProtectedRoute and never mounts for unauthenticated users.
 * 3. Tab switching while a multiplayer session is active is intercepted: the target tab is
 *    stored in pendingTab, a confirmation modal opens, and navigation only completes if the
 *    user explicitly confirms via "Leave multiplayer session".
 */
import { useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { PlayHubOverview } from "@/features/play/components/PlayHubOverview";
import { QuickGameView } from "@/features/play/components/QuickGameView";
import { PlayOnlineView } from "@/features/play/components/PlayOnlineView";
import { VariantsView } from "@/features/play/components/VariantsView";
import TestMaiaBoard from "@/features/test-maia/TestMaiaBoard";
import { LeaveGameConfirmModal } from "@/features/play/components/LeaveGameConfirmModal";
import { ProtectedRoute } from "@/features/account/ProtectedRoute";
import { useGameSession } from "@/features/play/useGameSession";
import { useMatchmaking } from "@/features/play/useMatchmaking";
import { soundManager } from "@/shared/lib/SoundManager";
import { featureFlags } from "@/shared/lib/featureFlags";
import { ArrowLeft } from "lucide-react";

export type PlayTab = "online" | "bots" | "variants" | "maia" | "quick";

const VALID_TABS: PlayTab[] = [
  "online",
  "bots",
  "variants",
  "quick",
  ...(featureFlags.showMaia ? (["maia"] as const) : []),
];

function resolveTab(raw: string | null): PlayTab | null {
  if (!raw) return null;
  return VALID_TABS.includes(raw as PlayTab) ? (raw as PlayTab) : null;
}

export default function PlayHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pendingTab, setPendingTab] = useState<PlayTab | null>(null);
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { descriptor: sessionDescriptor, leaveGame } = useGameSession();
  const { phase, resetToIdle } = useMatchmaking();

  const rawTab = searchParams.get("tab");
  const activeTab: PlayTab | null = resolveTab(rawTab);

  const isMultiplayerActive =
    sessionDescriptor !== null || phase === "searching" || phase === "found";

  const switchTab = useCallback((tab: PlayTab | null, hash?: string) => {
    if (!tab) {
      // Return to clean /play
      navigate("/play", { replace: false });
    } else {
      if (hash) {
        navigate(`/play?tab=${tab}#${hash}`, { replace: false });
      } else {
        setSearchParams({ tab }, { replace: false });
      }
    }
  }, [navigate, setSearchParams]);

  const handleTabChange = useCallback((requested: PlayTab | null, hash?: string) => {
    // Allow free switching when not on the online tab, or no session is active.
    if (activeTab !== "online" || !isMultiplayerActive) {
      switchTab(requested, hash);
      return;
    }
    // Block: record intent, open modal.
    setPendingTab(requested);
    setPendingHash(hash ?? null);
    setIsModalOpen(true);
  }, [activeTab, isMultiplayerActive, switchTab]);

  const handleNavigateOnlineSection = useCallback((sectionId: "recent-games" | "leaderboard") => {
    handleTabChange("online", sectionId);
  }, [handleTabChange]);

  const handleStay = () => {
    setPendingTab(null);
    setPendingHash(null);
    setIsModalOpen(false);
  };

  const handleLeave = () => {
    leaveGame();
    resetToIdle();

    const target = pendingTab;
    const hash = pendingHash;
    setPendingTab(null);
    setPendingHash(null);
    setIsModalOpen(false);
    switchTab(target, hash ?? undefined);
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col bg-gradient-to-b from-brand-bg via-brand-bg to-brand-surface/20">
      {/* ── Sub-Mode Back Navigation ── */}
      {activeTab !== null && (
        <div className="px-3 sm:px-6 lg:px-8 pt-4 pb-2">
          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              handleTabChange(null);
            }}
            className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
            aria-label="Back to Play Hub"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Play Hub</span>
          </button>
        </div>
      )}

      {/* ── Page Content ── */}
      <div className="flex-1">
        {activeTab === null && (
          <PlayHubOverview
            onSelectTab={(tab) => handleTabChange(tab)}
            onNavigateOnlineSection={handleNavigateOnlineSection}
          />
        )}

        {activeTab === "online" && (
          <ProtectedRoute>
            <PlayOnlineView />
          </ProtectedRoute>
        )}

        {(activeTab === "bots" || activeTab === "quick") && <QuickGameView />}

        {activeTab === "variants" && <VariantsView />}

        {activeTab === "maia" && featureFlags.showMaia && <TestMaiaBoard />}
      </div>

      {/* ── Active-Game Guard Modal ── */}
      <LeaveGameConfirmModal
        isOpen={isModalOpen}
        onStay={handleStay}
        onLeave={handleLeave}
      />
    </div>
  );
}
