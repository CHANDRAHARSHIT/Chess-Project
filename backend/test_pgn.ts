import { Chess } from 'chess.js';

const pgn = `[Event "FIDE Candidates 2026"]
[Site "Cap St Georges CYP"]
[Date "2026.04.15"]
[Round "14"]
[White "Praggnanandhaa R, "]
[Black "Nakamura, Hikaru"]
[Result "1/2-1/2"]
[WhiteElo "2741"]
[BlackElo "2810"]
[ECO ""]

1. d4  d5 2. c4  e6 3. Nf3  Nf6 4. Nc3  h6 5. g3  Be7 6. Bg2  O-O 7. Ne5  Nc6 8. Nxc6  bxc6 9. c5  e5 10. dxe5  Ng4 11. Qd4  f6 12. f4  Rb8 13. h3  fxe5 14. fxe5  Nf2 15. Rh2  Ne4 16. Nxe4  dxe4 17. Be3  Bf5 18. O-O-O  Bg5 19. Qc4+  Kh8 20. Rxd8  Bxe3+ 21. Rd2  Rfd8 22. Qc3  Bxd2+ 23. Qxd2  Rxd2 24. Kxd2  Rxb2+ 25. Ke3  Kg8 26. Bxe4  Be6 27. Rh1  Kf7 28. h4  Rxa2 29. Rb1  Ra3+ 30. Kd4  Ra4+ 31. Ke3  Ra3+ 32. Kd4  Ra4+ 33. Ke3  Ra3+ 1/2-1/2`;

const chess = new Chess();
try {
  chess.loadPgn(pgn);
  console.log('Success!', chess.history().length);
} catch (e) {
  console.log('Error:', e.message);
}
