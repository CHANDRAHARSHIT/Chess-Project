import type { CuratedPuzzle } from "@/types/puzzles-puzzle.types";

export const FALLBACK_PUZZLES: CuratedPuzzle[] = [
  { id: "fb1", fen: "6k1/p4ppp/8/8/8/8/3R1PPP/6K1 b - - 0 1", moves: "a7a6 d2d8", rating: 1000, ratingDeviation: 75, popularity: 100, nbPlays: 100, themes: ["backRankMate", "mate", "mateIn1", "short"] },
  { id: "fb2", fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR b KQkq - 0 1", moves: "d7d6 f3f7", rating: 1000, ratingDeviation: 75, popularity: 100, nbPlays: 100, themes: ["attackingF2F7", "mate", "mateIn1", "short"] },
  { id: "fb3", fen: "6k1/p4ppp/8/8/8/8/2qR1PPP/6K1 b - - 0 1", moves: "c2c1 d2d1 c1d1", rating: 1000, ratingDeviation: 75, popularity: 100, nbPlays: 100, themes: ["endgame", "trappedPiece", "advantage"] },
  { id: "fb4", fen: "7k/5Qpp/8/8/8/8/8/6K1 b - - 0 1", moves: "h7h6 f7f8", rating: 1000, ratingDeviation: 75, popularity: 100, nbPlays: 100, themes: ["mate", "mateIn1", "exposedKing", "short"] },
  { id: "fb5", fen: "6k1/1R3ppp/8/8/8/8/5PPP/6K1 b - - 0 1", moves: "h7h6 b7b8", rating: 1000, ratingDeviation: 75, popularity: 100, nbPlays: 100, themes: ["backRankMate", "mate", "mateIn1", "short"] },
];
