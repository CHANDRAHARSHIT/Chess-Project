export interface OpeningStat {
  eco: string;
  name: string;
  count: number;
  wins: number;
  draws: number;
  losses: number;
  scorePercentage: number;
}

export interface RecommendedOpening extends OpeningStat {
  variation: string;
  compositeScore: number;
  playProbability: number;
  expectedEval: number | null; // in pawns
  bestMove: string | null;
  humanDifficulty: number; // 1 to 10
}

export interface PreferredResponse {
  move: string;
  count: number;
  wins: number;
  draws: number;
  losses: number;
  scorePercentage: number;
}

export interface StandardLine {
  opening: string;
  prefix: string;
  count: number;
  totalOpeningGames: number;
  percentage: number;
}

export interface AvoidedOpenings {
  insufficientData?: boolean;
  minGamesRequired?: number;
  currentGames?: number;
}

export interface TimeAnalysis {
  usableGames: number;
  unusableGames: number;
  timeTrouble: {
    frequency: number;
    scorePercentage: number;
  };
  noTimeTrouble: {
    frequency: number;
    scorePercentage: number;
  };
  rushedCriticalMoves: number;
}

export interface WeaknessDetail {
  pgnHash: string;
  ply: number;
  phase: "opening" | "middlegame" | "endgame";
  severity: "mistake" | "blunder";
  swing: number;
  evalBefore: number;
  evalAfter: number;
  inTimeTrouble: boolean;
}

export interface Weaknesses {
  openingBlunders: number;
  middlegameBlunders: number;
  endgameBlunders: number;
  timeTroubleBlunders: number;
  lostWinningPositions: number;
  details: WeaknessDetail[];
}

export interface OpponentReport {
  totalGames: number;
  classifiedGames: number;
  unclassifiedGames: number;
  threshold: number;
  overallScorePercentage: number;
  mostFrequent: OpeningStat[];
  mostSuccessful: OpeningStat[];
  leastSuccessful: OpeningStat[];
  preferredResponses: Record<string, PreferredResponse[]>;
  standardLines: StandardLine[];
  avoidedOpenings: string[] | AvoidedOpenings;
  underperformingVariations: RecommendedOpening[];
  timeAnalysis: TimeAnalysis;
  weaknesses: Weaknesses;
  recommendationsAsWhite: RecommendedOpening[];
  recommendationsAsBlack: RecommendedOpening[];
}
