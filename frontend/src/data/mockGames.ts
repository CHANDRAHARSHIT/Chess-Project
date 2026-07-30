export interface MockGame {
  id: number;
  white: string;
  black: string;
  result: string;
  moves: number;
  year: number;
  pgn: string;
  opening: string;
  fen: string;
  date?: string;
  event?: string;
  site?: string;
}

export const MOCK_GAMES: MockGame[] = [
  {
    id: 1,
    white: "Garry Kasparov (2812)",
    black: "Lucas Vermoulen",
    result: "1-0",
    moves: 10,
    year: 2025,
    pgn: "1. e4 d6 2. d4 c5 3. c3 Be6 4. Nf3 Na6 5. d5 Nh6 6. dxe6 fxe6 7. Bb5+ Kf7 8. Ng5+ Kf6 9. Qf3+ Ke5 10. Qf4#",
    opening: "B07: Pirc Defense",
    fen: "r2q1b1r/pp2p1pp/n2pp2n/1Bp1k1N1/4PQ2/2P5/PP3PPP/RNB1K2R b KQ - 2 10",
    date: "2025.10.21",
    event: "Kasparov Simul",
    site: "Online",
  },
  {
    id: 2,
    white: "Garry Kasparov (2812)",
    black: "Marc Oosterlynck",
    result: "1-0",
    moves: 12,
    year: 2025,
    pgn: "1. e4 d6 2. d4 Nd7 3. Nf3 Ngf6",
    opening: "Pirc Defense: Antal Defense",
    fen: "r1bqkb1r/pppn1ppp/3p1n2/4p3/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 4",
    date: "2025.10.21",
    event: "Kasparov Simul",
    site: "Online",
  },
  {
    id: 3,
    white: "Garry Kasparov (2812)",
    black: "Nico Ramacker",
    result: "1-0",
    moves: 16,
    year: 2025,
    pgn: "1. d4 d5 2. c4 dxc4 3. e3 a6",
    opening: "Queen's Gambit Accepted",
    fen: "rnbqkbnr/1pp1pppp/p7/8/2pP4/4P3/PP3PPP/RNBQKBNR w KQkq - 0 4",
    date: "2025.10.21",
    event: "Kasparov Simul",
    site: "Online",
  },
  {
    id: 4,
    white: "Garry Kasparov (2812)",
    black: "David Gotlib",
    result: "1-0",
    moves: 30,
    year: 2025,
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Nc3 Bc5",
    opening: "Closed Sicilian Defense: Traditional Line",
    fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 2 4",
    date: "2025.10.21",
    event: "Kasparov Simul",
    site: "Online",
  },
  {
    id: 5,
    white: "Garry Kasparov (2812)",
    black: "Anish Giri (2744)",
    result: "0-1",
    moves: 32,
    year: 2021,
    pgn: "1. c4 Nf6 2. Nc3 e5 3. e3 Nc6",
    opening: "English Opening: Two Knights Variation",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2P5/2N1P3/PP1P1PPP/R1BQKBNR w KQkq - 1 4",
    date: "2021.05.12",
    event: "Grand Chess Tour",
    site: "Online",
  },
];
