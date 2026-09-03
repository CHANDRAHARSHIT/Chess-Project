import React from 'react';
import type { PathwayComponentProps, PathNode } from '@/types/puzzles-pathway.types';
import { RoyalGoldPathway } from '@/components/puzzles-RoyalGoldPathway';
import { ROYAL_GOLD_NODES } from '@/data/puzzles-royalGoldNodes';
import { RoyalPurplePathway } from '@/components/puzzles-RoyalPurplePathway';
import { ROYAL_PURPLE_NODES } from '@/data/puzzles-royalPurpleNodes';
import { VerdantForestPathway } from '@/components/puzzles-VerdantForestPathway';
import { VERDANT_FOREST_NODES } from '@/data/puzzles-verdantForestNodes';
import { ObsidianPathway } from '@/components/puzzles-ObsidianPathway';
import { OBSIDIAN_NODES } from '@/data/puzzles-obsidianNodes';
import { CrystalPathway } from '@/components/puzzles-CrystalPathway';
import { CRYSTAL_NODES } from '@/data/puzzles-crystalNodes';
import { InfernoPathway } from '@/components/puzzles-InfernoPathway';
import { INFERNO_NODES } from '@/data/puzzles-infernoNodes';

export { RoyalGoldPathway } from '@/components/puzzles-RoyalGoldPathway';
export { RoyalPurplePathway } from '@/components/puzzles-RoyalPurplePathway';
export { VerdantForestPathway } from '@/components/puzzles-VerdantForestPathway';
export { ObsidianPathway } from '@/components/puzzles-ObsidianPathway';
export { CrystalPathway } from '@/components/puzzles-CrystalPathway';
export { InfernoPathway } from '@/components/puzzles-InfernoPathway';

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
