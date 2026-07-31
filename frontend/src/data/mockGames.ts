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
    black: "Lucas Vermeulen",
    result: "1-0",
    moves: 10,
    year: 2025,
    pgn: "1. e4 d6 2. d4 c5 3. c3 Be6 4. Nf3 Na6 5. d5 Nh6 6. dxe6 fxe6 7. Bb5+ Kf7 8. Ng5+ Kf6 9. Qf3+ Ke5 10. Qf4#",
    opening: "Alapin Sicilian Defense",
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
    pgn: "1. d4 d6 2. e4 Nd7 3. Nf3 Ngf6 4. e5 Nd5 5. c4 dxe5 6. cxd5 e4 7. Ne5 f6 8. Qh5+ g6 9. Nxg6 e5 10. Nxe5+ Ke7 11. Qf7+ Kd6 12. Nc4#",
    opening: "Pirc Defense: Antal Defense",
    fen: "r1bq1b1r/pppn1Q1p/3k1p2/3P4/2NPp3/8/PP3PPP/RNB1KB1R b KQ - 4 12",
    date: "2025.10.21",
    event: "Kasparov Simul",
    site: "Online",
  },
  {
    id: 3,
    white: "Garry Kasparov (2812)",
    black: "Nico Ramacker (1855)",
    result: "1-0",
    moves: 16,
    year: 2025,
    pgn: "1. d4 d5 2. c4 dxc4 3. e3 a6 4. Bxc4 Nf6 5. Nf3 e6 6. Qe2 Be7 7. O-O O-O 8. e4 b5 9. Bd3 c5 10. dxc5 Bxc5 11. e5 Nd5 12. Bxh7+ Kh8 13. Ng5 g6 14. Qe4 Kg7 15. Qh4 Rh8 16. Nxe6+",
    opening: "Queen's Gambit Accepted",
    fen: "rnbq3r/5pkB/p3N1p1/1pbnP3/7Q/8/PP3PPP/RNB2RK1 b - - 0 16",
    date: "2025.10.21",
    event: "Kasparov Simul",
    site: "Online",
  },
  {
    id: 4,
    white: "Garry Kasparov (2812)",
    black: "Floris Penninckx",
    result: "1-0",
    moves: 19,
    year: 2025,
    pgn: "1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Nc6 5. c4 Nb6 6. e6 fxe6 7. Bd3 d5 8. c5 Nc4 9. b3 N4a5 10. Ng5 Nxd4 11. Bxh7 Rxh7 12. Nxh7 Nf5 13. Qh5+ Kd7 14. Qf7 Kc6 15. Nxf8 Nd4 16. Na3 b5 17. Bb2 Ba6 18. Ng6 e5 19. Nxe5+",
    opening: "Alekhine's Defense: Modern, Larsen-Haakert Variation",
    fen: "r2q4/p1p1pQp1/b1k5/npPpN3/3n4/NP6/PB3PPP/R3K2R b KQ - 0 19",
    date: "2025.10.21",
    event: "Kasparov Simul",
    site: "Online",
  },
  {
    id: 5,
    white: "Garry Kasparov (2812)",
    black: "Els van Doesburg",
    result: "1-0",
    moves: 21,
    year: 2025,
    pgn: "1. d4 d5 2. Bf4 Nf6 3. e3 Nc6 4. Nf3 a5 5. c4 dxc4 6. Bxc4 e6 7. O-O Be7 8. Nc3 O-O 9. e4 b6 10. Rc1 Ba6 11. Bxa6 Rxa6 12. Qe2 Qc8 13. d5 Nb4 14. a3 Bc5 15. axb4 axb4 16. Nb5 c6 17. Nd6 Qc7 18. Qxa6 Bxd6 19. Rxc6 Qe7 20. Bxd6 Qe8 21. Bxf8",
    opening: "Queen's Pawn Opening: Zukertort, Chigorin Variation",
    fen: "4qBk1/5ppp/QpR1pn2/3P4/1p2P3/5N2/1P3PPP/5RK1 b - - 0 21",
    date: "2025.10.21",
    event: "Kasparov Simul",
    site: "Online",
  },
  {
    id: 6,
    white: "Garry Kasparov (2812)",
    black: "Wim Jansen",
    result: "1-0",
    moves: 21,
    year: 2025,
    pgn: "1. e4 e6 2. d4 d5 3. exd5 exd5 4. Nf3 Nf6 5. Bd3 Bd6 6. O-O O-O 7. h3 Nc6 8. c3 h6 9. Re1 g6 10. Bxh6 Bf5 11. Bxf5 gxf5 12. Bxf8 Qxf8 13. Nbd2 a6 14. Ne5 Re8 15. Qf3 Nxe5 16. dxe5 Bxe5 17. Qxf5 Qg7 18. Rxe5 Rxe5 19. Qxe5 b5 20. Re1 a5 21. Re3",
    opening: "French Defense: Exchange Variation",
    fen: "6k1/2p2pq1/5n2/pp1pQ3/8/2P1R2P/PP1N1PP1/6K1 b - - 1 21",
    date: "2025.10.21",
    event: "Kasparov Simul",
    site: "Online",
  },
  {
    id: 7,
    white: "Garry Kasparov (2812)",
    black: "Dries Buytaert",
    result: "1-0",
    moves: 25,
    year: 2025,
    pgn: "1. e4 c6 2. d4 d5 3. e5 Bf5 4. h4 h5 5. c4 e6 6. Nc3 Bb4 7. Qb3 Bxc3+ 8. bxc3 Qc7 9. Ba3 Nd7 10. Nf3 Rb8 11. Bd6 Qc8 12. Bxb8 Qxb8 13. cxd5 exd5 14. c4 Ne7 15. Bd3 Bxd3 16. Qxd3 dxc4 17. Qxc4 Nb6 18. Qc2 Qc8 19. Kf1 Qd7 20. Re1 Kd8 21. Ng5 Qd5 22. e6 Rf8 23. exf7 Qc4+ 24. Qxc4 Nxc4 25. Ne6+",
    opening: "B12: Caro-Kann Defense: Advance, Tal Variation",
    fen: "3k1r2/pp2nPp1/2p1N3/7p/2nP3P/8/P4PP1/4RK1R b - - 1 25",
    date: "2025.10.21",
    event: "Kasparov Simul",
    site: "Online",
  },
  {
    id: 8,
    white: "Garry Kasparov (2812)",
    black: "Wannes Nys",
    result: "1-0",
    moves: 27,
    year: 2025,
    pgn: "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Be3 Nbd7 7. Nf3 c6 8. O-O Ne8 9. Qc2 e6 10. Rfd1 Nb6 11. c5 Nd7 12. cxd6 Nxd6 13. Bg5 f6 14. Bf4 Qe7 15. Rac1 b6 16. d5 e5 17. dxc6 Nb8 18. Nd5 Qf7 19. Bd2 Be6 20. Bb4 Bxd5 21. Rxd5 Rc8 22. Rxd6 Qe7 23. Qb3+ Kh8 24. Rcd1 Bf8 25. Rd8 Qxd8 26. Rxd8 Rxd8 27. c7",
    opening: "E91: King's Indian Defense: Orthodox Variation",
    fen: "rn1r1b1k/p1P4p/1p3pp1/4p3/1B2P3/1Q3N2/PP2BPPP/6K1 b - - 0 27",
    date: "2025.10.21",
    event: "Kasparov Simul",
    site: "Online",
  },
];
