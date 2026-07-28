import stockfish from 'stockfish';
import { Chess } from 'chess.js';

let engineInstance: any = null;
let currentResolver: ((res: { evaluation: number | null, mateIn: number | null, bestMove: string }) => void) | null = null;
let multiPvResolver: ((res: { move: string, evaluation: number | null, mateIn: number | null }[]) => void) | null = null;
let currentMultiPv: { move: string, evaluation: number | null, mateIn: number | null }[] = [];
let currentEval: number | null = null;
let currentMate: number | null = null;
let readyResolver: (() => void) | null = null;

// Override console.log to intercept Stockfish WASM output cleanly
const originalLog = console.log;
console.log = function(...args: any[]) {
  const line = args.join(' ');
  
  // Stockfish-specific output lines
  if (line.startsWith('info ') || line.startsWith('bestmove ') || line === 'uciok' || line === 'readyok' || line.startsWith('Stockfish') || line.startsWith('id ')) {
    handleEngineOutput(line);
  } else {
    // Pass through normal logs
    originalLog.apply(console, args);
  }
};

function handleEngineOutput(line: string) {
  if (line === 'readyok' && readyResolver) {
    readyResolver();
    readyResolver = null;
  } else if (line.startsWith('info ') && line.includes('score ')) {
    const cpMatch = line.match(/score cp (-?\d+)/);
    const mateMatch = line.match(/score mate (-?\d+)/);
    const pvMatch = line.match(/ pv (\S+)/);
    const multipvMatch = line.match(/multipv (\d+)/);
    
    let evaluation = null;
    let mateIn = null;
    let move = pvMatch ? pvMatch[1] : '';

    if (cpMatch) {
      evaluation = parseInt(cpMatch[1], 10);
    } else if (mateMatch) {
      mateIn = parseInt(mateMatch[1], 10);
    }

    if (multipvMatch && move) {
       const index = parseInt(multipvMatch[1], 10) - 1;
       currentMultiPv[index] = { move, evaluation, mateIn };
    }

    // For backwards compatibility with single-PV
    if (!multipvMatch || parseInt(multipvMatch[1], 10) === 1) {
       currentEval = evaluation;
       currentMate = mateIn;
    }
  } else if (line.startsWith('bestmove ')) {
    const parts = line.split(' ');
    const bestMove = parts[1] || '';
    if (currentResolver) {
      currentResolver({ evaluation: currentEval, mateIn: currentMate, bestMove });
      currentResolver = null;
    }
    if (multiPvResolver) {
      multiPvResolver([...currentMultiPv]);
      multiPvResolver = null;
    }
  }
}

async function ensureEngine() {
  if (engineInstance) return;
  engineInstance = await stockfish();
  
  // Normalize command sending (some builds use sendCommand, some use postMessage, some use ccall directly)
  if (!engineInstance.sendCommand) {
    engineInstance.sendCommand = engineInstance.postMessage || function(cmd: string) { 
      engineInstance.ccall("command", null, ["string"], [cmd], {async: /^go\b/.test(cmd)}); 
    };
  }

  engineInstance.sendCommand("uci");
  engineInstance.sendCommand("isready");
  
  await new Promise<void>(resolve => {
    readyResolver = resolve;
  });
}

export const EngineService = {
  /**
   * Evaluates a single FEN position using Stockfish at depth 14 with MultiPV.
   */
  async evaluatePositionMultiPv(fen: string, numPv: number = 3): Promise<{ move: string, evaluation: number | null, mateIn: number | null }[]> {
    await ensureEngine();
    
    return new Promise((resolve) => {
      currentMultiPv = [];
      multiPvResolver = resolve;
      
      engineInstance.sendCommand(`setoption name MultiPV value ${numPv}`);
      engineInstance.sendCommand(`position fen ${fen}`);
      engineInstance.sendCommand("go depth 14");
    });
  },

  /**
   * Evaluates a single FEN position using Stockfish at depth 14.
   */
  async evaluatePosition(fen: string): Promise<{ evaluation: number | null, mateIn: number | null, bestMove: string }> {
    await ensureEngine();
    
    // We assume sequential calls.
    return new Promise((resolve) => {
      currentEval = null;
      currentMate = null;
      currentResolver = resolve;
      
      engineInstance.sendCommand(`setoption name MultiPV value 1`);
      engineInstance.sendCommand(`position fen ${fen}`);
      engineInstance.sendCommand("go depth 14");
    });
  },

  /**
   * Reconstructs a game from a list of SAN moves and evaluates every position.
   */
  async evaluateGame(moves: { san: string }[]): Promise<{ 
    ply: number, 
    fen: string, 
    evaluation: number | null, 
    mateIn: number | null, 
    evaluationWhitePerspective: number | null, 
    mateInWhitePerspective: number | null, 
    bestMove: string 
  }[]> {
    const chess = new Chess();
    const results = [];
    
    // Evaluate the initial position (ply 0)
    const initialFen = chess.fen();
    const initialEval = await this.evaluatePosition(initialFen);
    results.push({
      ply: 0,
      fen: initialFen,
      ...initialEval,
      evaluationWhitePerspective: initialFen.includes(' w ') ? initialEval.evaluation : (initialEval.evaluation !== null ? -initialEval.evaluation : null),
      mateInWhitePerspective: initialFen.includes(' w ') ? initialEval.mateIn : (initialEval.mateIn !== null ? -initialEval.mateIn : null)
    });
    
    for (let i = 0; i < moves.length; i++) {
      chess.move(moves[i].san);
      const currentFen = chess.fen();
      const evalResult = await this.evaluatePosition(currentFen);
      
      results.push({
        ply: i + 1,
        fen: currentFen,
        ...evalResult,
        evaluationWhitePerspective: currentFen.includes(' w ') ? evalResult.evaluation : (evalResult.evaluation !== null ? -evalResult.evaluation : null),
        mateInWhitePerspective: currentFen.includes(' w ') ? evalResult.mateIn : (evalResult.mateIn !== null ? -evalResult.mateIn : null)
      });
    }
    
    return results;
  }
};
