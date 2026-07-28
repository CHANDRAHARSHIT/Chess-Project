import { Chess } from 'chess.js';

const pgn = `[Event "Speed Chess Championship"]
[Site "Chess.com"]
[Date "2024.09.08"]
[Round "Final"]
[White "Nakamura, Hikaru"]
[Black "Firouzja, Alireza"]
[Result "1/2-1/2"]
[WhiteElo "2802"]
[BlackElo "2759"]
[TimeControl "180+1"]

1. e4 {[%clk 0:02:59]} e5 {[%clk 0:02:58]} 2. Nf3 {[%clk 0:02:57]} 1/2-1/2
`;

const chess = new Chess();
chess.loadPgn(pgn);
console.log(chess.getComments());
