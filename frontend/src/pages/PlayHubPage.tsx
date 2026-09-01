/**
 * PlayHubPage.tsx
 *
 * Unified Play Hub. Hosts Quick Game, Play Online, and Variants as tabs within
 * a single page. The active tab is the sole source of truth via useSearchParams().
 *
 * Key invariants enforced here:
 * 1. Tab param is validated on every render — invalid/missing values fall back to "quick".
 * 2. PlayOnlineView is gated behind ProtectedRoute and never mounts for unauthenticated users.
 * 3. Tab switching while a multiplayer session is active is intercepted: the target tab is
 *    stored in pendingTab, a confirmation modal opens, and navigation only completes if the
 *    user explicitly confirms via "Leave multiplayer session".
 */
import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  PlayTabBar,
  type PlayTab,
} from "@/features/play/components/PlayTabBar";
import { QuickGameView } from "@/features/play/components/QuickGameView";
import { PlayOnlineView } from "@/features/play/components/PlayOnlineView";
import { VariantsView } from "@/features/play/components/VariantsView";
import { LeaveGameConfirmModal } from "@/features/play/components/LeaveGameConfirmModal";
import { ProtectedRoute } from "@/features/account/ProtectedRoute";
import { useGameSession } from "@/features/play/useGameSession";
import { useMatchmaking } from "@/features/play/useMatchmaking";

const VALID_TABS: PlayTab[] = ["quick", "online", "variants"];

function isValidTab(value: string | null): value is PlayTab {
  return VALID_TABS.includes(value as PlayTab);
}

export default function PlayHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingTab, setPendingTab] = useState<PlayTab | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { descriptor: sessionDescriptor, leaveGame } = useGameSession();
  const { phase, resetToIdle } = useMatchmaking();

  // Single source of truth: URL param, validated and defaulted.
  const rawTab = searchParams.get("tab");
  const activeTab: PlayTab = isValidTab(rawTab) ? rawTab : "quick";

  // sessionDescriptor is checked first — a live game remains protected even if
  // matchmaking phase has already reset to idle after consumeMatch().
  const isMultiplayerActive =
    sessionDescriptor !== null || phase === "searching" || phase === "found";

  const switchTab = (tab: PlayTab) => {
    setSearchParams({ tab }, { replace: false });
  };

  const handleTabChange = (requested: PlayTab) => {
    // Allow free switching when not on the online tab, or no session is active.
    if (activeTab !== "online" || !isMultiplayerActive) {
      switchTab(requested);
      return;
    }
    // Block: record intent, open modal.
    setPendingTab(requested);
    setIsModalOpen(true);
  };

  const handleStay = () => {
    setPendingTab(null);
    setIsModalOpen(false);
  };

  const handleLeave = () => {
    // Cleanup sequencing per plan §3 domain analysis:
    // - leaveGame() closes the WebSocket and clears GameSessionContext state.
    //   Safe to call in all cases — no-op when no WebSocket is open.
    // - resetToIdle() clears the matchmaking poll timer, ticket, and phase.
    //   Required for the searching/found cases where no session exists yet.
    // The two calls target separate context domains and are never redundant.
    leaveGame();
    resetToIdle();

    const target = pendingTab ?? "quick";
    setPendingTab(null);
    setIsModalOpen(false);
    switchTab(target);
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col bg-gradient-to-b from-brand-bg via-brand-bg to-brand-surface/20">
      {/* ── Tab Bar Chrome ── */}
      <div className="sticky top-0 z-10 px-2.5 sm:px-6 lg:px-8 pt-4 pb-3 border-b border-white/5 bg-brand-bg/80 backdrop-blur-xl">
        <PlayTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isOnlineActive={isMultiplayerActive}
        />
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1">
        {activeTab === "quick" && <QuickGameView />}

        {activeTab === "online" && (
          <ProtectedRoute>
            <PlayOnlineView />
          </ProtectedRoute>
        )}

        {activeTab === "variants" && <VariantsView />}
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
