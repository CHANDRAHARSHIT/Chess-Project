/**
 * StoryModeMap.tsx
 *
 * The main adventure map component. Renders the node graph with connecting
 * paths and handles navigation between map view, battle, encounter, and
 * rest site screens. Manages game state (current node, completed nodes).
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Map } from "lucide-react";
import {
  STORY_MAP_NODES,
  type NodeStatus,
} from "../../data/storyModeMapData";
import StoryModeNodeIcon from "./StoryModeNodeIcon";
import StoryModeMapCanvas from "./StoryModeMapCanvas";
import StoryModeBattle from "./StoryModeBattle";
import StoryModeEncounter from "./StoryModeEncounter";
import StoryModeRestSite from "./StoryModeRestSite";

type ActiveView =
  | { kind: "map" }
  | { kind: "battle"; nodeId: number }
  | { kind: "encounter"; nodeId: number }
  | { kind: "rest"; nodeId: number };

export default function StoryModeMap() {
  // ── Game state persisted in component (resets on page refresh) ─────────
  const [completedNodes, setCompletedNodes] = useState<Set<number>>(
    new Set([0]) // Start node is always completed
  );
  const [currentNodeId, setCurrentNodeId] = useState<number>(0);
  const [activeView, setActiveView] = useState<ActiveView>({ kind: "map" });
  const [journeyComplete, setJourneyComplete] = useState(false);

  // ── Node status calculation ───────────────────────────────────────────
  const getNodeStatus = useCallback(
    (id: number): NodeStatus => {
      if (id === currentNodeId && !completedNodes.has(id)) return "active";
      if (completedNodes.has(id)) return "completed";

      // Available if any of its predecessor nodes is completed
      // (A node is a predecessor of this node if that node has this node in its edges)
      const isReachable = STORY_MAP_NODES.some(
        (n) => completedNodes.has(n.id) && n.edges.includes(id)
      );
      if (isReachable) return "available";

      return "locked";
    },
    [completedNodes, currentNodeId]
  );

  // ── Node click handler ────────────────────────────────────────────────
  const handleNodeClick = useCallback(
    (nodeId: number) => {
      const node = STORY_MAP_NODES.find((n) => n.id === nodeId);
      if (!node) return;

      const status = getNodeStatus(nodeId);
      if (status !== "available" && status !== "active") return;

      setCurrentNodeId(nodeId);

      switch (node.type) {
        case "start":
          // Start node — just mark as current and completed
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
    [getNodeStatus]
  );

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
    setCompletedNodes(new Set([0]));
    setCurrentNodeId(0);
    setActiveView({ kind: "map" });
    setJourneyComplete(false);
  }, []);

  // ── Progress ──────────────────────────────────────────────────────────
  const progress = useMemo(() => {
    // Don't count start node
    const totalNodes = STORY_MAP_NODES.length - 1;
    const completedCount = completedNodes.size - 1; // minus start node
    return Math.round((completedCount / totalNodes) * 100);
  }, [completedNodes]);

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

            {/* Map container */}
            <div
              className="relative w-full rounded-2xl border border-brand-border/30 overflow-hidden shadow-lg"
              style={{
                aspectRatio: "3 / 4",
                background:
                  "radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse at 20% 30%, rgba(168,85,247,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(212,175,110,0.06) 0%, transparent 50%), rgb(var(--obsidian-mid-rgb) / 0.4)",
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
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-0.5 h-0.5 rounded-full bg-brand-accent/20"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0, 0.6, 0],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 3,
                    repeat: Infinity,
                    delay: i * 0.7,
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

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 px-2">
              {[
                { color: "#f87171", label: "Monster" },
                { color: "#c084fc", label: "Mystery" },
                { color: "#fb923c", label: "Rest Site" },
                { color: "#D4AF6E", label: "Boss" },
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

            {/* Journey complete overlay */}
            <AnimatePresence>
              {journeyComplete && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="flex flex-col items-center gap-6 p-10 rounded-2xl border border-brand-accent/40 bg-brand-accent/5 backdrop-blur-md max-w-md w-full mx-4"
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
                      <span className="text-5xl">👑</span>
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

                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent/15 border border-brand-accent/40 text-brand-accent hover:bg-brand-accent/25 transition-all text-sm font-medium cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Start New Adventure
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
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
