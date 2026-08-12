/**
 * StoryModeMapCanvas.tsx
 *
 * SVG overlay that draws dashed connecting paths between map nodes.
 * Paths are colour-coded:
 *   - Completed → golden glow
 *   - Available → pulsing white
 *   - Locked    → dim grey
 */

import { motion } from "framer-motion";
import type { StoryNode, NodeStatus } from "@/features/story-mode/storyModeMapData";

interface StoryModeMapCanvasProps {
  nodes: StoryNode[];
  getNodeStatus: (id: number) => NodeStatus;
}

interface EdgeInfo {
  fromId: number;
  toId: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  status: "completed" | "available" | "locked";
}

export default function StoryModeMapCanvas({
  nodes,
  getNodeStatus,
}: StoryModeMapCanvasProps) {
  // Build edge list
  const edges: EdgeInfo[] = [];
  const seen = new Set<string>();

  for (const node of nodes) {
    for (const targetId of node.edges) {
      const key = `${Math.min(node.id, targetId)}-${Math.max(node.id, targetId)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const target = nodes.find((n) => n.id === targetId);
      if (!target) continue;

      const fromStatus = getNodeStatus(node.id);
      const toStatus = getNodeStatus(targetId);

      let edgeStatus: "completed" | "available" | "locked" = "locked";
      if (fromStatus === "completed" && toStatus === "completed") {
        edgeStatus = "completed";
      } else if (fromStatus === "completed" && (toStatus === "available" || toStatus === "active")) {
        edgeStatus = "available";
      }

      edges.push({
        fromId: node.id,
        toId: targetId,
        fromX: node.x,
        fromY: node.y,
        toX: target.x,
        toY: target.y,
        status: edgeStatus,
      });
    }
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ zIndex: 5 }}
    >
      <defs>
        {/* Gold glow for completed paths */}
        <filter id="story-path-glow-gold" x="-20" y="-20" width="140" height="140" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* White glow for available paths */}
        <filter id="story-path-glow-white" x="-20" y="-20" width="140" height="140" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="0.3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {edges.map((edge) => {
        const pathId = `edge-${edge.fromId}-${edge.toId}`;

        let stroke: string;
        let opacity: number;
        let filter: string | undefined;
        let strokeWidth: number;

        switch (edge.status) {
          case "completed":
            stroke = "#D4AF6E";
            opacity = 0.9;
            filter = "url(#story-path-glow-gold)";
            strokeWidth = 0.6;
            break;
          case "available":
            stroke = "#D4AF6E";
            opacity = 0.8;
            filter = "url(#story-path-glow-gold)";
            strokeWidth = 0.5;
            break;
          default:
            stroke = "rgba(212, 175, 110, 0.4)";
            opacity = 0.5;
            filter = undefined;
            strokeWidth = 0.3;
        }

        return (
          <motion.line
            key={pathId}
            x1={edge.fromX}
            y1={edge.fromY}
            x2={edge.fromX === edge.toX ? edge.toX + 0.01 : edge.toX}
            y2={edge.fromY === edge.toY ? edge.toY + 0.01 : edge.toY}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray="2 2"
            strokeLinecap="round"
            opacity={opacity}
            filter={filter}
            initial={{ pathLength: 0, opacity: 0, strokeDashoffset: 10 }}
            animate={
              edge.status === "available"
                ? { pathLength: 1, opacity, strokeDashoffset: [10, 0] }
                : { pathLength: 1, opacity, strokeDashoffset: 0 }
            }
            transition={
              edge.status === "available"
                ? {
                    pathLength: { duration: 1.2, delay: 0.3 },
                    opacity: { duration: 1.2, delay: 0.3 },
                    strokeDashoffset: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }
                : { duration: 1.2, delay: 0.3 }
            }
          />
        );
      })}
    </svg>
  );
}
