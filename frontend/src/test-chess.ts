import { Chess } from 'chess.js';
const game = new Chess();
try {
  game.move({ from: 'e2', to: 'e4', promotion: 'q' });
  console.log('success');
} catch(e) {
  console.log('error', e.message);
}
