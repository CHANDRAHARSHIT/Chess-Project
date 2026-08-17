import type { PathNode } from '@/features/puzzles/pathway.types';

export const OBSIDIAN_NODES: PathNode[] = [
  { id: 'ob_001', levelNumber: 1, x: 75, y: 90, fen: 'rnbqkn1r/ppppp2p/5p2/6p1/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 3', solution: 'Qh5#', rating: 600, title: 'Obsidian Gate' },
  { id: 'ob_002', levelNumber: 2, x: 40, y: 84, fen: 'rnbqk1nr/ppp2ppp/3p4/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4', solution: 'Qxf7#', rating: 660, title: 'Volcanic Rift' },
  { id: 'ob_003', levelNumber: 3, x: 22, y: 78, fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4', solution: 'Qxf7#', rating: 710, title: 'Magma Chamber' },
  { id: 'ob_004', levelNumber: 4, x: 55, y: 72, fen: 'r1bqk2r/ppp2ppp/2np4/2b1p3/2B1P1n1/2NP1Q2/PPP2PPP/R1B1K1NR w KQkq - 2 6', solution: 'Qxf7#', rating: 760, title: 'Basalt Pass' },
  { id: 'ob_005', levelNumber: 5, x: 78, y: 66, fen: '7k/5Qpp/8/8/8/8/8/6K1 w - - 0 1', solution: 'Qf8#', rating: 800, title: 'Obsidian Citadel' },
  { id: 'ob_006', levelNumber: 6, x: 62, y: 60, fen: '6k1/5ppp/8/8/8/2Q5/5PPP/6K1 w - - 0 1', solution: 'Qc8#', rating: 840, title: 'Dark Keep' },
  { id: 'ob_007', levelNumber: 7, x: 32, y: 54, fen: '6k1/5ppp/8/8/8/8/1R3PPP/6K1 w - - 0 1', solution: 'Rb8#', rating: 880, title: 'Shadow Vault' },
  { id: 'ob_008', levelNumber: 8, x: 20, y: 48, fen: '3r2k1/5ppp/8/8/8/8/1Q3PPP/3R2K1 w - - 0 1', solution: 'Rxd8#', rating: 920, title: 'Lava Abyss' },
  { id: 'ob_009', levelNumber: 9, x: 48, y: 42, fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', solution: 'Rd8#', rating: 960, title: 'Brimstone Spire' },
  { id: 'ob_010', levelNumber: 10, x: 75, y: 36, fen: '8/8/8/8/8/6k1/6rp/7K b - - 0 1', solution: 'Rg1#', rating: 1010, title: 'Obsidian Throne' },
  { id: 'ob_011', levelNumber: 11, x: 58, y: 30, fen: 'r1b2r1k/ppp2p1p/2n5/4p3/2B5/6R1/PPP2PPP/3R2K1 w - - 0 1', solution: 'Bxf7#', rating: 1060, title: 'Dark Nexus' },
  { id: 'ob_012', levelNumber: 12, x: 26, y: 24, fen: 'r2qk2r/ppp2ppp/2n5/3np3/2B5/3P1Q2/PPP2PPP/R1B1K2R w KQkq - 0 1', solution: 'Qxf7#', rating: 1110, title: 'Infernal Peak' },
];
