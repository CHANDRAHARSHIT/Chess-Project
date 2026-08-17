import React from 'react';
import type { PathwayComponentProps, PathNode } from '@/features/puzzles/pathway.types';
import { RoyalGoldPathway } from './RoyalGoldPathway';
import { ROYAL_GOLD_NODES } from './royalGoldNodes';
import { RoyalPurplePathway } from './RoyalPurplePathway';
import { ROYAL_PURPLE_NODES } from './royalPurpleNodes';
import { VerdantForestPathway } from './VerdantForestPathway';
import { VERDANT_FOREST_NODES } from './verdantForestNodes';
import { ObsidianPathway } from './ObsidianPathway';
import { OBSIDIAN_NODES } from './obsidianNodes';
import { CrystalPathway } from './CrystalPathway';
import { CRYSTAL_NODES } from './crystalNodes';
import { InfernoPathway } from './InfernoPathway';
import { INFERNO_NODES } from './infernoNodes';

export { RoyalGoldPathway } from './RoyalGoldPathway';
export { RoyalPurplePathway } from './RoyalPurplePathway';
export { VerdantForestPathway } from './VerdantForestPathway';
export { ObsidianPathway } from './ObsidianPathway';
export { CrystalPathway } from './CrystalPathway';
export { InfernoPathway } from './InfernoPathway';

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
