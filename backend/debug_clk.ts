import { Chess } from 'chess.js';

const rawPgn = `[Event "Speed Chess Championship"]
[Site "Chess.com"]
[Date "2024.09.08"]
[Round "Final"]
[White "Nakamura, Hikaru"]
[Black "Firouzja, Alireza"]
[Result "1/2-1/2"]
[WhiteElo "2802"]
[BlackElo "2759"]
[TimeControl "180+1"]

1. e4 {[%clk 0:02:59]} e5 {[%clk 0:02:58]} 2. Nf3 {[%clk 0:02:57]} 1/2-1/2`;

const chess = new Chess();
chess.loadPgn(rawPgn);
const comments = (chess as any).getComments ? (chess as any).getComments() : [];
console.log("Comments:", comments);

const history = chess.history({ verbose: true });
for (let j = 0; j < history.length; j++) {
  console.log("History after:", history[j].after);
  const comment = comments.find((c: any) => c.fen === history[j].after);
  console.log("Found comment:", comment);
  if (comment) {
    const match = comment.comment.match(/\[%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)\]/);
    console.log("Regex match:", match);
  }
}
