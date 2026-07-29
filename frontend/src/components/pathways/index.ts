import React from 'react';
import type { PathwayComponentProps, PathNode } from '../../types/PuzzlePath';
import { RoyalGoldPathway, ROYAL_GOLD_NODES } from './RoyalGold/RoyalGoldPathway';
import { RoyalPurplePathway, ROYAL_PURPLE_NODES } from './RoyalPurple/RoyalPurplePathway';
import { VerdantForestPathway, VERDANT_FOREST_NODES } from './VerdantForest/VerdantForestPathway';
import { ObsidianPathway, OBSIDIAN_NODES } from './Obsidian/ObsidianPathway';
import { CrystalPathway, CRYSTAL_NODES } from './Crystal/CrystalPathway';
import { InfernoPathway, INFERNO_NODES } from './Inferno/InfernoPathway';

export { RoyalGoldPathway } from './RoyalGold/RoyalGoldPathway';
export { RoyalPurplePathway } from './RoyalPurple/RoyalPurplePathway';
export { VerdantForestPathway } from './VerdantForest/VerdantForestPathway';
export { ObsidianPathway } from './Obsidian/ObsidianPathway';
export { CrystalPathway } from './Crystal/CrystalPathway';
export { InfernoPathway } from './Inferno/InfernoPathway';

export const PATHWAYS: Record<string, React.ComponentType<PathwayComponentProps>> = {
  RoyalGold: RoyalGoldPathway,
  RoyalPurple: RoyalPurplePathway,
  VerdantForest: VerdantForestPathway,
  Obsidian: ObsidianPathway,
  Crystal: CrystalPathway,
  Inferno: InfernoPathway,
};

export const PATHWAY_NODES: Record<string, PathNode[]> = {
  RoyalGold: ROYAL_GOLD_NODES,
  RoyalPurple: ROYAL_PURPLE_NODES,
  VerdantForest: VERDANT_FOREST_NODES,
  Obsidian: OBSIDIAN_NODES,
  Crystal: CRYSTAL_NODES,
  Inferno: INFERNO_NODES,
};

export interface PathwayMetadata {
  id: string;
  name: string;
  description: string;
}

export const PATHWAY_LIST: PathwayMetadata[] = [
  { id: 'RoyalGold', name: 'Royal Gold', description: 'Regal castle adventure with ornate gold tiling.' },
  { id: 'RoyalPurple', name: 'Royal Purple', description: 'Floating royal citadel with glowing violet beams.' },
  { id: 'VerdantForest', name: 'Verdant Forest', description: 'Lush green wilderness trail with mossy paths.' },
  // { id: 'Obsidian', name: 'Obsidian Keep', description: 'Dark basalt fortress with volcanic magma cracks.' },
  // { id: 'Crystal', name: 'Crystal Ice', description: 'Glacial frost platforms with cyan ice beams.' },
  // { id: 'Inferno', name: 'Inferno', description: 'Fiery crimson volcanic trail with magma flares.' },
];
