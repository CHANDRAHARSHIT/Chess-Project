/**
 * StoryModeMap.tsx
 *
 * The main adventure map component. Renders the node graph with connecting
 * paths and handles navigation between map view, battle, encounter, and
 * rest site screens. Manages game state (current node, completed nodes).
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Map, Home, X, LogIn } from "lucide-react";
import {
  STORY_MAP_NODES,
  type NodeStatus,
} from "../../data/storyModeMapData";
import StoryModeNodeIcon from "./StoryModeNodeIcon";
import StoryModeMapCanvas from "./StoryModeMapCanvas";
import StoryModeBattle from "./StoryModeBattle";
import StoryModeEncounter from "./StoryModeEncounter";
import StoryModeRestSite from "./StoryModeRestSite";
import { useSession } from "../../hooks/useSession";

type ActiveView =
  | { kind: "map" }
  | { kind: "battle"; nodeId: number }
  | { kind: "encounter"; nodeId: number }
  | { kind: "rest"; nodeId: number };

export default function StoryModeMap() {
  const { session, status, signIn } = useSession();

  // ── Game state persisted in component (resets on page refresh for guests) ──
  const [completedNodes, setCompletedNodes] = useState<Set<number>>(new Set());
  const [currentNodeId, setCurrentNodeId] = useState<number>(-1);
  const [activeView, setActiveView] = useState<ActiveView>({ kind: "map" });
  const [journeyComplete, setJourneyComplete] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState<number | null>(null);
  const [hasIgnoredGuestWarning, setHasIgnoredGuestWarning] = useState(false);

  // ── Persistence Logic ────────────────────────────────────────────────
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user?.id) {
      const stored = localStorage.getItem(`storyProgress_${session.user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCompletedNodes(new Set(parsed.completedNodes || []));
          setCurrentNodeId(parsed.currentNodeId ?? -1);
          setJourneyComplete(parsed.journeyComplete ?? false);
        } catch (e) {
          console.error("Failed to parse story progress", e);
        }
      }
    } else {
      // Unauthenticated or guest: reset progress
      setCompletedNodes(new Set());
      setCurrentNodeId(-1);
      setJourneyComplete(false);
    }
    setIsLoaded(true);
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (!isLoaded) return;

    if (status === "authenticated" && session?.user?.id) {
      const key = `storyProgress_${session.user.id}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          completedNodes: Array.from(completedNodes),
          currentNodeId,
          journeyComplete,
        })
      );
    }
  }, [completedNodes, currentNodeId, journeyComplete, status, session?.user?.id, isLoaded]);

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
        const currentNode = STORY_MAP_NODES.find((n) => n.id === currentNodeId);
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
    (nodeId: number, bypassWarning = false) => {
      const node = STORY_MAP_NODES.find((n) => n.id === nodeId);
      if (!node) return;

      const nodeStatus = getNodeStatus(nodeId);
      if (nodeStatus !== "available" && nodeStatus !== "active") return;

      if (
        nodeId === 0 &&
        status === "unauthenticated" &&
        !bypassWarning &&
        !hasIgnoredGuestWarning
      ) {
        setShowGuestWarning(nodeId);
        return;
      }

      setCurrentNodeId(nodeId);

      switch (node.type) {
        case "start":
          // Legacy start node handling, though we now use monster as node 0
          setCompletedNodes((prev) => new Set([...prev, nodeId]));
          break;
        case "monster":
        case "boss":
          setActiveView({ kind: "battle", nodeId });
          break;
        case "mystery":
          setActiveView({ kind: "encounter", nodeId });
          break;
        case "fireplace":
          setActiveView({ kind: "rest", nodeId });
          break;
      }
    },
    [getNodeStatus, status, hasIgnoredGuestWarning]
  );

  const handleContinueAsGuest = useCallback(() => {
    setHasIgnoredGuestWarning(true);
    if (showGuestWarning !== null) {
      handleNodeClick(showGuestWarning, true);
    }
    setShowGuestWarning(null);
  }, [showGuestWarning, handleNodeClick]);

  // ── Battle callbacks ──────────────────────────────────────────────────
  const handleBattleVictory = useCallback(() => {
    if (activeView.kind !== "battle") return;
    const nodeId = activeView.nodeId;
    const node = STORY_MAP_NODES.find((n) => n.id === nodeId);

    setCompletedNodes((prev) => new Set([...prev, nodeId]));
    setActiveView({ kind: "map" });

    if (node?.type === "boss") {
      setJourneyComplete(true);
    }
  }, [activeView]);

  const handleBattleDefeat = useCallback(() => {
    // Stay on map, node is NOT completed
    setActiveView({ kind: "map" });
  }, []);

  const handleRetreat = useCallback(() => {
    setActiveView({ kind: "map" });
  }, []);

  // ── Encounter / rest complete ─────────────────────────────────────────
  const handleEncounterComplete = useCallback(() => {
    if (activeView.kind !== "encounter") return;
    setCompletedNodes((prev) => new Set([...prev, activeView.nodeId]));
    setActiveView({ kind: "map" });
  }, [activeView]);

  const handleRestComplete = useCallback(() => {
    if (activeView.kind !== "rest") return;
    setCompletedNodes((prev) => new Set([...prev, activeView.nodeId]));
    setActiveView({ kind: "map" });
  }, [activeView]);

  // ── Reset adventure ───────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const confirmReset = useCallback(() => {
    setCompletedNodes(new Set());
    setCurrentNodeId(-1);
    setActiveView({ kind: "map" });
    setJourneyComplete(false);
    setShowResetConfirm(false);

    // Explicitly clear from local storage immediately so it doesn't rely solely on the effect
    if (status === "authenticated" && session?.user?.id) {
      localStorage.removeItem(`storyProgress_${session.user.id}`);
    }
  }, [status, session?.user?.id]);

  // ── Progress ──────────────────────────────────────────────────────────
  const progress = useMemo(() => {
    if (journeyComplete) return 100;
    // A single full run from start to boss consists of exactly 8 nodes
    const MAX_PATH_LENGTH = 8;
    const completedCount = completedNodes.size;
    return Math.min(100, Math.round((completedCount / MAX_PATH_LENGTH) * 100));
  }, [completedNodes, journeyComplete]);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {activeView.kind === "map" ? (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Progress bar & controls */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                <Map className="w-4 h-4 text-brand-secondary" />
                <div className="flex items-center gap-2">
                  <div className="w-32 h-1.5 rounded-full bg-brand-surface/50 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-brand-accent/60 to-brand-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs font-mono text-brand-secondary">
                    {progress}%
                  </span>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border/40 text-brand-secondary hover:text-brand-text hover:border-red-500/40 transition-all text-xs font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Map wrapper for scrolling */}
            <div className="relative w-full rounded-2xl overflow-hidden">
              <div className="w-full h-[75vh] min-h-[500px] rounded-2xl border border-[#D4AF6E]/40 overflow-y-auto overflow-x-hidden shadow-lg relative bg-[rgb(var(--obsidian-mid-rgb)/0.4)] custom-scrollbar">
                <div
                  className="relative w-full min-h-[1200px] sm:min-h-[1400px] overflow-hidden"
                  style={{
                    backgroundColor: "#080b14",
                    backgroundImage:
                      "radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 30%, rgba(168,85,247,0.1) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(212,175,110,0.15) 0%, transparent 50%)",
                  }}
                >
                  {/* Fog / atmosphere layers */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 0%, rgb(var(--obsidian-rgb) / 0.08) 50%, rgb(var(--obsidian-rgb) / 0.18) 100%)",
                    }}
                  />

                  {/* Animated ambient particles */}
                  {[...Array(35)].map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: 1.5 + (i % 3),
                        height: 1.5 + (i % 3),
                        background: i % 2 === 0 ? "rgba(168, 85, 247, 0.7)" : "rgba(212, 175, 110, 0.7)",
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
                    nodes={STORY_MAP_NODES}
                    getNodeStatus={getNodeStatus}
                  />

                  {/* Node icons */}
                  {STORY_MAP_NODES.map((node) => (
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

                      <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full max-w-xs">
                        <button
                          onClick={() => window.location.href = "/"}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border/40 text-brand-secondary hover:text-brand-text hover:bg-brand-surface transition-all text-sm font-medium cursor-pointer"
                        >
                          <Home className="w-4 h-4" />
                          Return to Home
                        </button>
                        <button
                          onClick={confirmReset}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent/15 border border-brand-accent/40 text-brand-accent hover:bg-brand-accent/25 transition-all text-sm font-medium cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restart Journey
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
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="flex flex-col items-center gap-5 p-8 rounded-2xl border border-red-500/30 bg-red-500/5 backdrop-blur-md max-w-sm w-full mx-4 shadow-2xl relative"
                      initial={{ scale: 0.8, y: 30 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, y: 30 }}
                      transition={{ type: "spring", duration: 0.5 }}
                    >
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="absolute top-4 right-4 text-brand-secondary hover:text-brand-text transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center text-red-400">
                        <RotateCcw className="w-8 h-8" />
                      </div>

                      <div className="text-center">
                        <h3 className="text-2xl font-display font-bold text-red-400">Abandon Run?</h3>
                        <p className="text-sm text-brand-secondary mt-2">
                          Are you sure you want to abandon this run and start over? All your current progress will be lost.
                        </p>
                      </div>

                      <div className="flex gap-3 mt-4 w-full">
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-brand-border/40 text-brand-secondary hover:text-brand-text hover:bg-brand-surface transition-all text-sm font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmReset}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition-all text-sm font-medium cursor-pointer"
                        >
                          Confirm
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Guest Warning Overlay */}
              <AnimatePresence>
                {showGuestWarning !== null && (
                  <motion.div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="flex flex-col items-center gap-5 p-8 rounded-2xl border border-[#D4AF6E]/60 bg-brand-accent/5 backdrop-blur-md max-w-sm w-full mx-4 shadow-[0_0_30px_rgba(212,175,110,0.15)] relative"
                      initial={{ scale: 0.8, y: 30 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, y: 30 }}
                      transition={{ type: "spring", duration: 0.5 }}
                    >
                      <button
                        onClick={() => setShowGuestWarning(null)}
                        className="absolute top-4 right-4 text-brand-secondary hover:text-brand-text transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="w-16 h-16 rounded-full bg-brand-accent/10 border-2 border-brand-accent/30 flex items-center justify-center text-brand-accent">
                        <LogIn className="w-8 h-8" />
                      </div>

                      <div className="text-center">
                        <h3 className="text-2xl font-display font-bold text-brand-accent">Sign In to Save</h3>
                        <p className="text-sm text-brand-secondary mt-2">
                          You are currently playing as a guest.<br />
                          Your progress will be lost if you refresh<br />
                          or close the page.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 mt-4 w-full">
                        <button
                          onClick={() => signIn()}
                          className="w-full px-4 py-2.5 rounded-xl bg-brand-accent/15 border border-brand-accent/40 text-brand-accent hover:bg-brand-accent/25 transition-all text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
                        >
                          <LogIn className="w-4 h-4" />
                          Sign In
                        </button>
                        <button
                          onClick={handleContinueAsGuest}
                          className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 text-brand-secondary hover:text-brand-text hover:bg-brand-surface transition-all text-sm font-medium cursor-pointer"
                        >
                          Continue without sign in
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 px-2">
              {[
                { color: "#ef4444", label: "Monster" },
                { color: "#a855f7", label: "Mystery" },
                { color: "#f97316", label: "Rest Site" },
                { color: "#eab308", label: "Boss" },
                { color: "#22c55e", label: "Completed" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 text-xs font-mono text-brand-secondary"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: item.color }}
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
          >
            <StoryModeBattle
              nodeId={activeView.nodeId}
              difficulty={
                STORY_MAP_NODES.find((n) => n.id === activeView.nodeId)
                  ?.difficulty ?? 1
              }
              onVictory={handleBattleVictory}
              onDefeat={handleBattleDefeat}
              onRetreat={handleRetreat}
            />
          </motion.div>
        ) : activeView.kind === "encounter" ? (
          <motion.div
            key="encounter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StoryModeEncounter
              nodeLabel={
                STORY_MAP_NODES.find((n) => n.id === activeView.nodeId)
                  ?.label ?? "Unknown"
              }
              onComplete={handleEncounterComplete}
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
          >
            <StoryModeRestSite
              nodeLabel={
                STORY_MAP_NODES.find((n) => n.id === activeView.nodeId)
                  ?.label ?? "Rest Site"
              }
              nodeDescription={
                STORY_MAP_NODES.find((n) => n.id === activeView.nodeId)
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
