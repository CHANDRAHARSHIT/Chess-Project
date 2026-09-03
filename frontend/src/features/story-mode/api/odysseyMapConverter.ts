import type { StoryNode, StoryNodeType } from "@/features/story-mode/storyModeMapData";
import type { DifficultyLevel } from "@/shared/chess/chess.types";
import type { OdysseyBackendMapNode } from "./odysseyApi";

/**
 * The backend's Start node carries no difficulty (OdysseyNode base class has
 * none) and its type is "start" — but the frontend has never rendered a
 * "start" node as its own screen (the map's node 0 has always been an
 * immediate Pawn Sentinel battle; the in-map character-select overlay the
 * "start" case in StoryModeMap's switch would otherwise open is the
 * Knight/Bishop/Rook roster the owner has said is being removed, and
 * character selection already happens on the mandatory Strategist screen
 * before the map ever loads). Converting "start" -> "enemy" here preserves
 * that existing behavior instead of resurrecting the deprecated screen.
 */
const START_NODE_DIFFICULTY: DifficultyLevel = 1;

/** Converts the backend's authoritative map (OdysseyNode[] JSON) into the frontend's StoryNode[] shape — field names already match 1:1 otherwise. */
export function toStoryNodes(nodes: OdysseyBackendMapNode[]): StoryNode[] {
  return nodes.map((node) => {
    const isStart = node.type === "start";
    return {
      id: node.id,
      type: (isStart ? "enemy" : node.type) as StoryNodeType,
      label: node.label,
      x: node.x,
      y: node.y,
      difficulty: (isStart ? START_NODE_DIFFICULTY : node.difficulty) as DifficultyLevel | undefined,
      edges: node.edges,
      description: node.description,
    };
  });
}
