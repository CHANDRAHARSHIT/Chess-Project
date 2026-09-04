/**
 * StoryModeMap.tsx
 *
 * The main adventure map component. Renders the node graph with connecting
 * paths and handles navigation between map view, battle, encounter, and
 * rest site screens. Manages game state (current node, completed nodes).
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Map, Home, Coins, Lightbulb, Eye, Hourglass, Shuffle } from "lucide-react";
import {
  type NodeStatus,
} from "@/features/story-mode/storyModeMapData";
import StoryModeNodeIcon from "./StoryModeNodeIcon";
import StoryModeMapCanvas from "./StoryModeMapCanvas";
import StoryModeMerchant from "./StoryModeMerchant"; // Force TS re-index
import StoryModeBattle from "./StoryModeBattle";

import StoryModeRestSite from "./StoryModeRestSite";
import StoryModePuzzleNode from "./StoryModePuzzleNode";
import StoryModeCharacterSelect from "./StoryModeCharacterSelect";
import { ConfirmAbandonModal } from "./TitleScreen/ConfirmAbandonModal";
import { useStoryModeRun } from "./StoryModeContext";
import { useSession } from "@/features/account/useSession";
import { OdysseyApiService } from "./api/odysseyApi";

type ActiveView =
  | { kind: "map" }
  | { kind: "battle"; nodeId: number }
  | { kind: "rest"; nodeId: number }
  | { kind: "merchant"; nodeId: number }
  | { kind: "puzzle"; nodeId: number }
  | { kind: "characterSelect"; nodeId: number };

interface StoryModeMapProps {
  onResetToTitle?: () => void;
}

export default function StoryModeMap({ onResetToTitle }: StoryModeMapProps = {}) {
  const { runState, resetRun, updateRunState, activeSlot } = useStoryModeRun();
  const { status } = useSession();

  // ── Game state derived from Context ──
  const completedNodes = useMemo(() => new Set(runState.completedNodes || []), [runState.completedNodes]);
  const currentNodeId = runState.currentNodeId ?? -1;
  const journeyComplete = runState.journeyComplete ?? false;

  const [activeView, setActiveView] = useState<ActiveView>({ kind: "map" });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll to current node or bottom on mount ────────────────────────────────────
  useEffect(() => {
    if (activeView.kind === "map" && scrollContainerRef.current) {
      // Small delay to ensure render is complete
      setTimeout(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        if (currentNodeId !== -1) {
          const nodeEl = document.getElementById(`map-node-${currentNodeId}`);
          if (nodeEl) {
            const targetTop = nodeEl.offsetTop - (container.offsetHeight / 2) + (nodeEl.offsetHeight / 2);
            container.scrollTo({
              top: Math.max(0, targetTop),
              behavior: 'smooth'
            });
            return;
          }
        }

        // Fallback: Scroll to bottom
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }, [activeView.kind, currentNodeId]);

  // ── Node status calculation ───────────────────────────────────────────
  const getNodeStatus = useCallback(
    (id: number): NodeStatus => {
      if (completedNodes.has(id)) return "completed";

      // If no nodes are completed, only the start node (0) is available
      if (completedNodes.size === 0) {
        if (id === 0) {
          return id === currentNodeId ? "active" : "available";
        }
        return "locked";
      }

      if (id === currentNodeId) return "active";

      // Single Path Logic:
      // You can ONLY progress to edges of your current node,
      // and ONLY if your current node has been completed!
      if (currentNodeId !== -1 && completedNodes.has(currentNodeId)) {
        const currentNode = (runState.mapNodes || []).find((n) => n.id === currentNodeId);
        if (currentNode?.edges.includes(id)) {
          return "available";
        }
      }

      return "locked";
    },
    [completedNodes, currentNodeId]
  );

  // ── Node click handler ────────────────────────────────────────────────
  const handleNodeClick = useCallback(
    (nodeId: number) => {
      const node = (runState.mapNodes || []).find((n) => n.id === nodeId);
      if (!node) return;

      const nodeStatus = getNodeStatus(nodeId);
      if (nodeStatus !== "available" && nodeStatus !== "active") return;

      if (nodeStatus !== "available" && nodeStatus !== "active") return;

      updateRunState({ currentNodeId: nodeId });

      // Best-effort backend sync — local navigation above is already authoritative.
      if (status === 'authenticated') {
        OdysseyApiService.enterNode(activeSlot, nodeId);
      }

      switch (node.type) {
        case "start":
          setActiveView({ kind: "characterSelect", nodeId });
          break;
        case "enemy":
        case "elite":
        case "boss":
          setActiveView({ kind: "battle", nodeId });
          break;
        case "puzzle":
          setActiveView({ kind: "puzzle", nodeId });
          break;

        case "rest":
          setActiveView({ kind: "rest", nodeId });
          break;
        case "merchant":
          setActiveView({ kind: "merchant", nodeId });
          break;
      }
    },
    [getNodeStatus, runState.mapNodes, updateRunState, status, activeSlot]
  );



  // ── Battle callbacks ──────────────────────────────────────────────────
  const handleBattleVictory = useCallback(() => {
    if (activeView.kind !== "battle") return;
    const nodeId = activeView.nodeId;
    const node = (runState.mapNodes || []).find((n) => n.id === nodeId);

    updateRunState((prev) => ({
      completedNodes: [...(prev.completedNodes || []), nodeId],
      journeyComplete: node?.type === "boss" ? true : prev.journeyComplete
    }));
    setActiveView({ kind: "map" });
  }, [activeView, runState.mapNodes, updateRunState]);

  const handleBattleDefeat = useCallback(() => {
    // Stay on map, node is NOT completed
    setActiveView({ kind: "map" });
  }, []);

  const handleRetreat = useCallback(() => {
    setActiveView({ kind: "map" });
  }, []);



  const handleRestComplete = useCallback(() => {
    if (activeView.kind !== "rest") return;
    updateRunState((prev) => ({ completedNodes: [...(prev.completedNodes || []), activeView.nodeId] }));
    setActiveView({ kind: "map" });
  }, [activeView, updateRunState]);

  const handleMerchantComplete = useCallback(() => {
    if (activeView.kind !== "merchant") return;
    updateRunState((prev) => ({ completedNodes: [...(prev.completedNodes || []), activeView.nodeId] }));
    setActiveView({ kind: "map" });
  }, [activeView, updateRunState]);

  const handlePuzzleComplete = useCallback(() => {
    if (activeView.kind !== "puzzle") return;
    updateRunState((prev) => ({ completedNodes: [...(prev.completedNodes || []), activeView.nodeId] }));
    setActiveView({ kind: "map" });
  }, [activeView, updateRunState]);

  // ── Reset adventure ───────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  // Intentionally depend on the specific primitives this reads (status, session?.user?.id)
  // rather than the whole `session` object, so this callback doesn't get a new identity
  // whenever `session` is re-fetched with the same user id.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const confirmReset = useCallback((keepProgress: boolean) => {
    setActiveView({ kind: "map" });
    setShowResetConfirm(false);

    // Reset global context run state (this automatically clears/resets everything)
    resetRun(keepProgress);

    // Call the callback to go back to title screen
    onResetToTitle?.();
  }, [resetRun, onResetToTitle]);

  // ── Progress ──────────────────────────────────────────────────────────
  const progress = useMemo(() => {
    if (journeyComplete) return 100;
    // A single full run from start to boss consists of exactly 16 nodes (Start + 15 Floors + Boss = 17 total steps, so 16 edges/nodes to complete)
    const MAX_PATH_LENGTH = 16;
    const completedCount = completedNodes.size;
    return Math.min(100, Math.round((completedCount / MAX_PATH_LENGTH) * 100));
  }, [completedNodes, journeyComplete]);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col min-h-0 flex-1">
      <AnimatePresence mode="wait">
        {activeView.kind === "map" || activeView.kind === "characterSelect" ? (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col min-h-0 flex-1"
          >
            {/* Progress bar & controls */}
            <div className="flex flex-wrap items-center justify-between mb-2 px-2 gap-y-2 gap-x-2 shrink-0">
              <div className="flex items-center gap-3">
                <Map className="w-4 h-4 text-brand-secondary" />
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-brand-surface/50 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-brand-accent/60 to-brand-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs font-mono text-brand-secondary min-w-[30px]">
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Relic Slots UI */}
              <div className="flex items-center gap-2 order-3 w-full justify-center sm:order-2 sm:w-auto sm:flex-1">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/20 dark:bg-yellow-500/10 border border-black/30 dark:border-yellow-500/30 shadow-[inset_0_2px_12px_rgba(0,0,0,0.5)] dark:shadow-none" title="Coins">
                  <Coins className="w-4 h-4 text-amber-600 dark:text-yellow-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] dark:drop-shadow-none" />
                  <span className="text-sm font-mono font-bold text-amber-600 dark:text-yellow-200" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{runState.coins}</span>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  {[...Array(5)].map((_, i) => {
                    const relicType = runState.relics[i];
                    if (relicType) {
                      let IconComponent = RotateCcw;
                      let charges = 0;
                      if (relicType === 'undo') { IconComponent = RotateCcw; charges = runState.undoCharges; }
                      if (relicType === 'hint') { IconComponent = Lightbulb; charges = runState.hintCharges; }
                      if (relicType === 'evalBar') { IconComponent = Eye; charges = runState.evalBarCharges; }
                      if (relicType === 'time') { IconComponent = Hourglass; charges = runState.timeCharges; }
                      if (relicType === 'reroll') { IconComponent = Shuffle; charges = runState.rerollCharges; }

                      return (
                        <div key={`slot-${i}`} className="relative w-8 h-8 rounded border border-brand-accent/50 bg-brand-accent/10 flex items-center justify-center shadow-[0_0_8px_rgba(168,85,247,0.3)]" title={`${relicType} (${charges}/3)`}>
                          <IconComponent className="w-4 h-4 text-brand-accent" />
                          <span className="absolute -bottom-2 -right-2 text-[10px] font-mono font-bold bg-brand-surface border border-brand-border rounded-full w-4 h-4 flex items-center justify-center text-brand-text">
                            {charges}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={`slot-${i}`} className="w-8 h-8 rounded border border-dashed border-brand-text/50 dark:border-brand-border/40 bg-black/10 dark:bg-brand-surface/20 flex items-center justify-center opacity-100 dark:opacity-80" title="Empty Slot">
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-text/60 dark:border-brand-border/40 text-brand-text dark:text-brand-secondary hover:text-brand-text hover:border-red-600 dark:hover:border-red-500/40 transition-all text-xs font-medium cursor-pointer shrink-0 order-2 sm:order-3 hover:bg-black/10 dark:hover:bg-white/5"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Map wrapper for scrolling */}
            <div className="relative w-full rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
              <div
                ref={scrollContainerRef}
                className="w-full flex-1 min-h-0 rounded-2xl border border-[#D4AF6E]/40 overflow-y-auto overflow-x-hidden shadow-lg relative bg-[rgb(var(--obsidian-mid-rgb)/0.4)] custom-scrollbar"
              >
                <div className="relative w-full min-h-[1600px] sm:min-h-[2200px] overflow-hidden story-map-bg">
                  {/* Fog / atmosphere layers */}
                  <div className="absolute inset-0 pointer-events-none story-map-fog" />

                  {/* Animated ambient particles */}
                  {[...Array(35)].map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className={`absolute rounded-full pointer-events-none ${i % 2 === 0 ? 'story-map-particle-1' : 'story-map-particle-2'}`}
                      style={{
                        width: 1.5 + (i % 3),
                        height: 1.5 + (i % 3),
                        left: `${(i * 17) % 100}%`,
                        top: `${(i * 23) % 100}%`,
                      }}
                      animate={{
                        y: [0, -60 - (i % 40)],
                        x: [0, ((i % 5) - 2) * 15],
                        opacity: [0, 0.8, 0],
                        scale: [0, 1.5, 0],
                      }}
                      transition={{
                        duration: 6 + (i % 4),
                        repeat: Infinity,
                        delay: (i % 7) * 0.6,
                        ease: "easeInOut",
                      }}
                    />
                  ))}

                  {/* SVG path lines */}
                  <StoryModeMapCanvas
                    nodes={(runState.mapNodes || [])}
                    getNodeStatus={getNodeStatus}
                  />

                  {/* Node icons */}
                  {(runState.mapNodes || []).map((node) => (
                    <StoryModeNodeIcon
                      key={node.id}
                      id={node.id}
                      type={node.type}
                      label={node.label}
                      status={getNodeStatus(node.id)}
                      x={node.x}
                      y={node.y}
                      onClick={() => handleNodeClick(node.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Journey complete overlay */}
              <AnimatePresence>
                {journeyComplete && (
                  <motion.div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="flex flex-col items-center gap-6 p-10 rounded-2xl border border-brand-accent/40 bg-brand-accent/5 backdrop-blur-md max-w-md w-full mx-4 shadow-2xl"
                      initial={{ scale: 0.8, y: 30 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, y: 30 }}
                      transition={{ type: "spring", duration: 0.6 }}
                    >
                      {/* Crown / star */}
                      <motion.div
                        className="w-24 h-24 rounded-full bg-brand-accent/15 border-2 border-brand-accent/50 flex items-center justify-center"
                        animate={{
                          boxShadow: [
                            "0 0 30px rgba(212,175,110,0.2)",
                            "0 0 60px rgba(212,175,110,0.5)",
                            "0 0 30px rgba(212,175,110,0.2)",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <span className="text-5xl inline-block -translate-y-1">👑</span>
                      </motion.div>

                      <div className="text-center">
                        <h3 className="text-3xl font-display font-bold text-brand-accent">
                          Journey Complete!
                        </h3>
                        <p className="text-sm text-brand-secondary mt-2 leading-relaxed">
                          You have conquered the Dark King and completed the
                          adventure! Your chess prowess knows no bounds.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 mt-2 w-full max-w-sm">
                        <button
                          onClick={() => confirmReset(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-accent/20 border border-brand-accent/50 text-brand-accent hover:bg-brand-accent/30 transition-all text-sm font-bold cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          New Game+ (Keep Coins & Relics)
                        </button>
                        <button
                          onClick={() => confirmReset(false)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-brand-border/40 text-brand-secondary hover:text-brand-text hover:bg-brand-surface transition-all text-sm font-medium cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4 opacity-50" />
                          Fresh Start (50 Coins)
                        </button>
                        <button
                          onClick={() => window.location.href = "/"}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-brand-secondary/60 hover:text-brand-secondary transition-all text-xs font-medium cursor-pointer"
                        >
                          <Home className="w-3 h-3" />
                          Return to Home
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reset Confirmation Overlay */}
              <AnimatePresence>
                {showResetConfirm && (
                  <motion.div
                    className="absolute inset-0 z-50 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ConfirmAbandonModal
                      onCancel={() => setShowResetConfirm(false)}
                      onConfirm={() => confirmReset(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Overlays / Modals */}
              <AnimatePresence>
                {activeView.kind === "characterSelect" && (
                  <StoryModeCharacterSelect
                    onSelect={() => {
                      // Completes the start node and returns to map
                      updateRunState((prev) => ({ completedNodes: [...(prev.completedNodes || []), activeView.nodeId] }));
                      setActiveView({ kind: "map" });
                    }}
                    onClose={() => setActiveView({ kind: "map" })}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 px-4 py-2 w-full max-w-3xl mx-auto border border-brand-border/30 bg-brand-surface/20 rounded-2xl shadow-inner backdrop-blur-sm shrink-0">
              {[
                { color: "#a855f7", label: "Puzzle" },
                { color: "#facc15", label: "Merchant" },
                { color: "#f97316", label: "Rest" },
                { color: "#ef4444", label: "Enemy" },
                { color: "#b91c1c", label: "Elite" },
                { color: "#fbbf24", label: "Boss" },
                { color: "#22c55e", label: "Completed" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-brand-secondary"
                >
                  <div
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                    style={{
                      background: item.color,
                      boxShadow: `0 0 8px ${item.color}80`
                    }}
                  />
                  {item.label}
                </div>
              ))}
            </div>

          </motion.div>
        ) : activeView.kind === "battle" ? (
          <motion.div
            key="battle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            <StoryModeBattle
              nodeId={activeView.nodeId}
              difficulty={
                (runState.mapNodes || []).find((n) => n.id === activeView.nodeId)
                  ?.difficulty ?? 1
              }
              onVictory={handleBattleVictory}
              onDefeat={handleBattleDefeat}
              onRetreat={handleRetreat}
            />
          </motion.div>

        ) : activeView.kind === "merchant" ? (
          <motion.div
            key="merchant"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            <StoryModeMerchant
              nodeId={activeView.nodeId}
              onComplete={handleMerchantComplete}
            />
          </motion.div>
        ) : activeView.kind === "puzzle" ? (
          <motion.div
            key="puzzle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            <StoryModePuzzleNode
              nodeId={activeView.nodeId}
              nodeLabel={
                (runState.mapNodes || []).find((n) => n.id === activeView.nodeId)
                  ?.label ?? "Puzzle Trial"
              }
              difficulty={
                (runState.mapNodes || []).find((n) => n.id === activeView.nodeId)
                  ?.difficulty ?? 1
              }
              onComplete={handlePuzzleComplete}
              onRetreat={handleRetreat}
            />
          </motion.div>
        ) : (
          <motion.div
            key="rest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            <StoryModeRestSite
              nodeId={activeView.nodeId}
              nodeLabel={
                (runState.mapNodes || []).find((n) => n.id === activeView.nodeId)
                  ?.label ?? "Rest Site"
              }
              nodeDescription={
                (runState.mapNodes || []).find((n) => n.id === activeView.nodeId)
                  ?.description ?? ""
              }
              onComplete={handleRestComplete}
              onRetreat={handleRetreat}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
