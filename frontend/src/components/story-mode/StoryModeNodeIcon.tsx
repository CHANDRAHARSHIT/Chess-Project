/**
 * StoryModeNodeIcon.tsx
 *
 * Renders an individual node on the adventure map.
 * Each node type gets a unique icon (skull, ?, campfire, crown, player).
 * The node's visual state (locked, available, completed, active) drives
 * its opacity, glow, and interactivity.
 */

import { motion } from "framer-motion";
import { Coins, Gem, Crown } from "lucide-react";
import type { StoryNodeType, NodeStatus } from "../../data/storyModeMapData";

interface StoryModeNodeIconProps {
  id: number;
  type: StoryNodeType;
  label: string;
  status: NodeStatus;
  x: number;
  y: number;
  onClick: () => void;
}

/** SVG icon per node type */
function NodeSVG({ type, status }: { type: StoryNodeType; status: NodeStatus }) {
  const isCompleted = status === "completed";
  const size = type === "boss" ? 40 : type === "start" ? 38 : 32;

  if (isCompleted) {
    // Checkmark for completed nodes
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  switch (type) {
    case "start":
      // Player pawn silhouette (kept inline as no replacement asset provided)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="6" r="3" />
          <path d="M9 11h6l1.5 5H7.5L9 11z" />
          <rect x="6" y="17" width="12" height="3" rx="1" />
        </svg>
      );
    case "enemy":
      return (
        <img
          src="/story mode assets/skull.svg"
          alt="Enemy"
          style={{ width: size, height: size }}
          className="object-contain"
        />
      );
    case "unknown":
      return (
        <img
          src="/story mode assets/question mark.svg"
          alt="Unknown"
          style={{ width: size, height: size }}
          className="object-contain"
        />
      );
    case "rest":
      return (
        <img
          src="/story mode assets/fireplace.svg"
          alt="Rest Site"
          style={{ width: size, height: size }}
          className="object-contain"
        />
      );
    case "boss":
      return (
        <img
          src="/story mode assets/star.svg"
          alt="Boss"
          style={{ width: size, height: size }}
          className="object-contain"
        />
      );
    case "merchant":
      return <Coins size={size - 4} strokeWidth={2} className="text-[#D4AF6E]" />;
    case "treasure":
      return <Gem size={size - 4} strokeWidth={2} className="text-[#38bdf8]" />;
    case "elite":
      return <Crown size={size - 4} strokeWidth={2.5} className="text-[#ef4444]" />;
    default:
      return null;
  }
}

/** Color mapping for node type + status */
function getNodeColors(type: StoryNodeType, status: NodeStatus) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";

  // Base golden colors for all unlocked/completed icons
  const baseGolden = {
    text: "#D4AF6E",
    border: "rgba(212, 175, 110, 0.7)",
    bg: "rgba(212, 175, 110, 0.15)",
  };

  if (isLocked) {
    return {
      bg: "var(--obsidian-glass)",
      border: "var(--marble-border)",
      text: "var(--text-secondary)",
      glow: "transparent",
      shadow: "none",
    };
  }

  // Determine glow color based on type
  let glowColor = "rgba(212, 175, 110, 0.4)";
  let shadow = "0 0 25px rgba(212, 175, 110, 0.5)";

  if (isCompleted) {
    glowColor = "rgba(34, 197, 94, 0.4)"; // Green
    shadow = "0 0 25px rgba(34, 197, 94, 0.5)";
  } else {
    switch (type) {
      case "enemy":
        glowColor = "rgba(239, 68, 68, 0.4)"; // Red
        shadow = "0 0 25px rgba(239, 68, 68, 0.6)";
        break;
      case "elite":
        glowColor = "rgba(185, 28, 28, 0.6)"; // Dark Red / Intense
        shadow = "0 0 35px rgba(185, 28, 28, 0.8)";
        break;
      case "unknown":
        glowColor = "rgba(168, 85, 247, 0.4)"; // Purple
        shadow = "0 0 25px rgba(168, 85, 247, 0.6)";
        break;
      case "rest":
        glowColor = "rgba(249, 115, 22, 0.4)"; // Orange
        shadow = "0 0 25px rgba(249, 115, 22, 0.6)";
        break;
      case "merchant":
        glowColor = "rgba(250, 204, 21, 0.5)"; // Yellow/Gold
        shadow = "0 0 30px rgba(250, 204, 21, 0.7)";
        break;
      case "treasure":
        glowColor = "rgba(56, 189, 248, 0.5)"; // Light Blue / Cyan
        shadow = "0 0 30px rgba(56, 189, 248, 0.7)";
        break;
      case "boss":
        glowColor = "rgba(250, 204, 21, 0.7)"; // Bright Yellow/Gold
        shadow = "0 0 40px rgba(250, 204, 21, 0.9)";
        break;
    }
  }

  return {
    ...baseGolden,
    glow: glowColor,
    shadow,
  };
}

export default function StoryModeNodeIcon({
  type,
  label,
  status,
  x,
  y,
  onClick,
}: StoryModeNodeIconProps) {
  const colors = getNodeColors(type, status);
  const isClickable = status === "available" || status === "active";
  const isAvailable = status === "available";
  const nodeSize = type === "boss" ? 76 : type === "start" ? 70 : 64;

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: status === "active" ? 20 : 10,
      }}
    >
      <motion.button
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        className="relative flex items-center justify-center group"
        style={{
          cursor: isClickable ? "pointer" : "default",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 + y * 0.005, duration: 0.5, type: "spring" }}
        whileHover={isClickable ? { scale: 1.12 } : undefined}
        whileTap={isClickable ? { scale: 0.95 } : undefined}
      >
        <motion.div
          className="relative flex items-center justify-center"
          animate={isAvailable || status === "active" ? { y: [0, -4, 0] } : {}}
          transition={
            isAvailable || status === "active"
              ? { duration: 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() }
              : {}
          }
        >
          {/* Outer glow ring for available nodes */}
          {isAvailable && (
            <motion.div
              className="absolute rounded-full"
              style={{
                width: nodeSize + 16,
                height: nodeSize + 16,
                background: colors.glow,
                filter: "blur(8px)",
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "-50%",
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          {/* Node circle */}
          <div
            className="relative flex items-center justify-center rounded-full transition-all duration-300"
            style={{
              width: nodeSize,
              height: nodeSize,
              background: colors.bg,
              border: `2px solid ${colors.border}`,
              color: colors.text,
              boxShadow: colors.shadow,
              backdropFilter: "blur(8px)",
            }}
          >
            <NodeSVG type={type} status={status} />
          </div>

          {/* Label */}
          <span
            className="absolute top-[100%] mt-2 text-xs font-mono font-semibold tracking-wide max-w-[140px] w-max text-center transition-all duration-300 px-3 py-1.5 rounded-lg border shadow-sm backdrop-blur-md leading-tight"
            style={{
              color: status === "locked" ? "var(--text-secondary)" : colors.text,
              backgroundColor: status === "locked" ? "var(--obsidian-glass)" : "var(--obsidian-mid)",
              borderColor: status === "locked" ? "transparent" : colors.border,
              opacity: status === "locked" ? 0.75 : 1,
            }}
          >
            {label}
          </span>
        </motion.div>
      </motion.button>
    </div>
  );
}
