import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ArrowRight, RotateCcw, Heart, Sparkles } from "lucide-react";
import { useStoryModeRun, MAX_RELIC_CHARGES } from "./StoryModeContext";
import type { RelicType } from "./StoryModeContext";
import { useSession } from "@/features/account/useSession";
import { OdysseyApiService } from "./api/odysseyApi";

interface StoryModeRestSiteProps {
  nodeId: number;
  nodeLabel: string;
  nodeDescription: string;
  onComplete: () => void;
  onRetreat: () => void;
}

export default function StoryModeRestSite({
  nodeId,
  nodeLabel,
  nodeDescription,
  onComplete,
  onRetreat,
}: StoryModeRestSiteProps) {
  const { runState, updateRunState, activeSlot } = useStoryModeRun();
  const { status } = useSession();

  const [isResting, setIsResting] = useState(false);
  const [hasRested, setHasRested] = useState(false);

  // Local state for randomized restoration
  const [restores, setRestores] = useState({
    undo: 0,
    hint: 0,
    evalBar: 0,
    time: 0,
    reroll: 0,
  });
  const [totalRestored, setTotalRestored] = useState(0);
  const [foundCoins, setFoundCoins] = useState<number | null>(null);
  const [foundRelic, setFoundRelic] = useState<RelicType | null>(null);

  useEffect(() => {
    let availablePoints = 5;
    const current = {
      undo: runState.undoCharges,
      hint: runState.hintCharges,
      evalBar: runState.evalBarCharges,
      time: runState.timeCharges,
      reroll: runState.rerollCharges,
    };
    const max = {
      undo: MAX_RELIC_CHARGES,
      hint: MAX_RELIC_CHARGES,
      evalBar: MAX_RELIC_CHARGES,
      time: MAX_RELIC_CHARGES,
      reroll: MAX_RELIC_CHARGES,
    };
    const newRestores = { undo: 0, hint: 0, evalBar: 0, time: 0, reroll: 0 };

    const keys = ["undo", "hint", "evalBar", "time", "reroll"] as const;
    while (availablePoints > 0) {
      const possibleKeys = keys.filter(
        (k) => current[k] + newRestores[k] < max[k],
      );
      if (possibleKeys.length === 0) break;
      const k = possibleKeys[Math.floor(Math.random() * possibleKeys.length)];
      newRestores[k]++;
      availablePoints--;
    }

    setRestores(newRestores);
    const restoredPoints = 5 - availablePoints;
    setTotalRestored(restoredPoints);

    // Random Discovery Logic
    let willFindCoins = Math.random() < 0.3;
    let willFindRelic = Math.random() < 0.1;

    const allRelicTypes: RelicType[] = [
      "undo",
      "hint",
      "evalBar",
      "time",
      "reroll",
    ];
    const unowned = allRelicTypes.filter((r) => !runState.relics.includes(r));

    if (restoredPoints === 0) {
      if (unowned.length > 0 && Math.random() < 0.5) {
        willFindRelic = true;
      } else {
        willFindCoins = true;
      }
    }

    if (willFindRelic && unowned.length > 0 && runState.relics.length < 5) {
      setFoundRelic(unowned[Math.floor(Math.random() * unowned.length)]);
    } else if (willFindCoins) {
      setFoundCoins(Math.floor(Math.random() * 21) + 15);
    }
  }, []); // Only run once on mount

  const handleRest = () => {
    setIsResting(true);

    // Apply random restores
    const updates: any = {
      undoCharges: runState.undoCharges + restores.undo,
      hintCharges: runState.hintCharges + restores.hint,
      evalBarCharges: runState.evalBarCharges + restores.evalBar,
      timeCharges: runState.timeCharges + restores.time,
      rerollCharges: runState.rerollCharges + restores.reroll,
    };

    const newRelics = [...runState.relics];

    // Add any relics that were restored but aren't currently in the inventory
    (["undo", "hint", "evalBar", "time", "reroll"] as const).forEach((key) => {
      if (restores[key] > 0 && !newRelics.includes(key)) {
        newRelics.push(key);
      }
    });

    if (foundCoins) {
      updates.coins = runState.coins + foundCoins;
    }

    if (foundRelic) {
      if (!newRelics.includes(foundRelic)) {
        newRelics.push(foundRelic);
      }
      updates[`${foundRelic}Charges`] = MAX_RELIC_CHARGES;
    }

    updates.relics = newRelics;

    updateRunState(updates);

    // Best-effort backend sync — the local grants above are already the authoritative reward.
    // Only nonzero restores are sent: the backend grants a (possibly 0-charge) relic for every
    // key present in `restores` regardless of its amount, matching how its own roll() only ever
    // includes keys it actually restored points into.
    if (status === 'authenticated') {
      const nonzeroRestores = Object.fromEntries(
        Object.entries(restores).filter(([, amount]) => amount > 0)
      );
      OdysseyApiService.applyRest(activeSlot, nodeId, {
        restores: nonzeroRestores,
        foundCoins,
        foundRelic,
      });
    }

    // Simulate rest sequence duration
    setTimeout(() => {
      setIsResting(false);
      setHasRested(true);
    }, 2000);
  };

  const renderRestoreRow = (label: string, key: keyof typeof restores) => {
    const currentCharge = runState[
      `${key}Charges` as keyof typeof runState
    ] as number;
    const maxCharge = MAX_RELIC_CHARGES;
    const restored = restores[key];
    const newTotal = currentCharge + restored;

    return (
      <div className="flex items-center justify-between w-full py-3 border-b border-brand-border/30 last:border-0">
        <span className="text-base font-mono text-brand-secondary">
          {label}
        </span>
        <div className="flex items-center gap-4">
          {restored > 0 && (
            <span
              className="text-sm font-mono text-green-400"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
            >
              +{restored}
            </span>
          )}
          <div className="flex items-center gap-1 min-w-[60px] justify-end">
            <span
              className={`text-base font-mono font-semibold ${restored > 0 ? "text-green-400" : "text-brand-text"}`}
              style={
                restored > 0
                  ? { textShadow: "0 1px 2px rgba(0,0,0,0.8)" }
                  : undefined
              }
            >
              {newTotal}
            </span>
            <span className="text-sm font-mono text-brand-secondary">
              / {maxCharge}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const particles = useMemo(() => {
    return [...Array(12)].map(() => ({
      left: `${30 + Math.random() * 40}%`,
      yTarget: -60 - Math.random() * 60,
      xTarget: (Math.random() - 0.5) * 40,
      durationResting: 1 + Math.random(),
      durationIdle: 1.5 + Math.random(),
    }));
  }, []);

  return (
    <motion.div
      className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Warm ambient glow */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[700px] h-[400px] bg-gradient-to-t from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0"
        style={{
          opacity: isResting ? 0.8 : hasRested ? 0.4 : 0.6,
          transition: "opacity 2s ease",
        }}
      />

      <motion.div
        className="relative z-10 max-w-lg w-full max-h-full overflow-y-auto flex flex-col items-center gap-4 py-6 px-4 sm:px-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 backdrop-blur-sm mx-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* Location tag */}
        <span className="text-xs font-mono text-orange-400/70 tracking-widest uppercase text-center">
          {nodeLabel}
        </span>

        {/* Campfire icon with flicker animation */}
        <div className="relative">
          <motion.div
            className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 20px rgba(251,146,60,0.2)",
                "0 0 50px rgba(251,146,60,0.4)",
                "0 0 30px rgba(251,146,60,0.3)",
                "0 0 20px rgba(251,146,60,0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 0.95, 1.05, 1],
                rotate: [0, -3, 3, -2, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Flame className="w-9 h-9 text-orange-400" />
            </motion.div>
          </motion.div>

          {/* Floating embers / healing particles */}
          {particles.slice(0, isResting ? 12 : 4).map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: p.left,
                bottom: "50%",
                backgroundColor: isResting ? "#4ade80" : "#fb923c",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                y: [0, p.yTarget],
                x: [0, p.xTarget],
                opacity: [0.8, 0],
                scale: [1, 0.2],
              }}
              transition={{
                duration: isResting ? p.durationResting : p.durationIdle,
                repeat: Infinity,
                delay: i * (isResting ? 0.1 : 0.4),
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!hasRested ? (
            <motion.div
              key="resting-state"
              className="flex flex-col items-center gap-4 w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-2xl font-display font-bold text-brand-text">
                Rest Site
              </h2>
              <p className="text-sm text-brand-secondary text-center leading-relaxed max-w-sm px-2">
                {isResting
                  ? "You rest by the fire, allocating your points to restore your mind…"
                  : nodeDescription}
              </p>

              {/* Random Restore UI */}
              <div className="w-full bg-brand-surface/30 border border-brand-border/40 rounded-xl p-4 mt-2">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-semibold text-brand-text">
                    Charges Restored
                  </span>
                  <div className="flex items-center gap-1.5 bg-orange-500/20 px-2 py-1 rounded text-orange-300 text-xs font-mono border border-orange-500/30">
                    <Sparkles className="w-3 h-3" />
                    <span style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                      {totalRestored} Restored
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {renderRestoreRow("Undo", "undo")}
                  {renderRestoreRow("Best Move", "hint")}
                  {renderRestoreRow("Eval Bar", "evalBar")}
                  {renderRestoreRow("Time", "time")}
                  {renderRestoreRow("Rerolls", "reroll")}

                  {foundCoins && (
                    <div className="flex items-center justify-between w-full py-3 border-b border-brand-border/30 last:border-0">
                      <span className="text-base font-mono text-brand-secondary">
                        Found Stash
                      </span>
                      <span className="text-base font-mono font-semibold text-yellow-400">
                        +{foundCoins} Coins
                      </span>
                    </div>
                  )}
                  {foundRelic && (
                    <div className="flex items-center justify-between w-full py-3 border-b border-brand-border/30 last:border-0">
                      <span className="text-base font-mono text-brand-secondary">
                        Found Item
                      </span>
                      <span className="text-base font-mono font-semibold text-purple-400 uppercase tracking-widest">
                        {foundRelic} Relic
                      </span>
                    </div>
                  )}
                  {totalRestored === 0 && !foundCoins && !foundRelic && (
                    <div className="text-center py-4 text-sm font-mono text-brand-secondary/60">
                      Nothing to find or restore here.
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap justify-center w-full mt-4">
                <button
                  onClick={onRetreat}
                  disabled={isResting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border/60 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 transition-all duration-200 text-sm font-medium cursor-pointer disabled:opacity-30"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retreat
                </button>
                <button
                  onClick={handleRest}
                  disabled={isResting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 hover:border-orange-500/60 transition-all duration-200 text-sm font-medium cursor-pointer disabled:opacity-30 disabled:scale-95"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  <Heart
                    className={`w-4 h-4 ${isResting ? "animate-pulse" : ""}`}
                  />
                  {isResting ? "Resting…" : "Rest & Apply"}
                </button>
              </div>

              {/* DEV Only: Skip Button */}
              {import.meta.env.DEV &&
                import.meta.env.VITE_ENABLE_STORY_DEV_TOOLS !== "false" && (
                  <div className="mt-4 p-2 rounded border border-dashed border-yellow-500/50 bg-yellow-500/10 flex justify-center opacity-80 hover:opacity-100 transition-opacity w-full">
                    <span className="text-[10px] text-yellow-500 font-mono self-center mr-2">
                      DEV:
                    </span>
                    <button
                      onClick={onComplete}
                      className="px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-[10px] font-mono hover:bg-green-500/40 cursor-pointer"
                    >
                      Skip Rest
                    </button>
                  </div>
                )}
            </motion.div>
          ) : (
            <motion.div
              key="rested-state"
              className="flex flex-col items-center gap-4 w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-display font-bold text-green-400 flex items-center gap-2">
                <Sparkles className="w-6 h-6" /> Rested
              </h2>
              <p className="text-sm text-brand-secondary text-center leading-relaxed max-w-sm px-2">
                Your focus is renewed. You are ready to face the challenges
                ahead.
              </p>

              {/* Divider */}
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent my-2" />

              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 hover:border-green-500/60 transition-all duration-200 text-sm font-medium cursor-pointer"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
              >
                Continue Journey
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
