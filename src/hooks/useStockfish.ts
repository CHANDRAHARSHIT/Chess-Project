import { useEffect, useRef, useState, useCallback } from 'react';
import { type DifficultyLevel, type EngineEvaluation, DIFFICULTY_CONFIGS, type EngineStatus } from '../types/chess';

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [evaluation, setEvaluation] = useState<EngineEvaluation>({ type: 'cp', value: 0.3 }); // Default slight white advantage
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('idle');
  const [engineDepth, setEngineDepth] = useState<number>(0);
  
  // Keep track of search timeout to clear if game resets or new move is made
  const searchTimeoutRef = useRef<number | null>(null);

  // Initialize the worker lazily
  const initWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    try {
      // Use Blob wrapper to bypass CORS for cdnjs Stockfish
      const blobCode = `
        importScripts("https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js");
      `;
      const blob = new Blob([blobCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      worker.postMessage('uci');
      worker.postMessage('isready');

      workerRef.current = worker;
      setEngineStatus('ready');
      return worker;
    } catch (e) {
      console.error('Failed to initialize Stockfish worker', e);
      setEngineStatus('error');
      return null;
    }
  }, []);

  // Terminate worker
  const terminateWorker = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.postMessage('quit');
      workerRef.current.terminate();
      workerRef.current = null;
      setEngineStatus('idle');
      setIsThinking(false);
    }
  }, []);

  // Stop current search
  const stopSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (workerRef.current && isThinking) {
      workerRef.current.postMessage('stop');
      setIsThinking(false);
    }
  }, [isThinking]);

  // Start search for a FEN position
  const getEngineMove = useCallback((fen: string, difficulty: DifficultyLevel, onMoveCallback?: (move: string) => void) => {
    const worker = initWorker();
    if (!worker) return;

    // Stop any ongoing search
    stopSearch();
    setIsThinking(true);
    setBestMove(null);
    setEngineStatus('thinking');

    const config = DIFFICULTY_CONFIGS[difficulty];
    const isBlackTurn = fen.split(' ')[1] === 'b';

    // Configure options
    worker.postMessage(`setoption name Skill Level value ${config.skillLevel}`);
    worker.postMessage(`position fen ${fen}`);

    // Set message listener
    worker.onmessage = (event: MessageEvent) => {
      const line: string = event.data;

      // Parse engine depth and evaluation
      // Example: info depth 4 seldepth 4 score cp -20 nodes 219 nps 109500 time 2 pv g1f3
      if (line.startsWith('info ')) {
        // Parse depth
        const depthMatch = line.match(/depth (\d+)/);
        if (depthMatch) {
          setEngineDepth(parseInt(depthMatch[1], 10));
        }

        // Parse evaluation score
        const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
        if (scoreMatch) {
          const type = scoreMatch[1] as 'cp' | 'mate';
          let value = parseInt(scoreMatch[2], 10);

          // Stockfish evaluates from the side to move's perspective.
          // Convert to perspective of white (white is positive, black is negative)
          if (isBlackTurn) {
            value = -value;
          }

          // If CP score, scale to pawn units (e.g. +1.50)
          setEvaluation({
            type,
            value: type === 'cp' ? value / 100 : value,
          });
        }
      }

      // Parse best move
      // Example: bestmove e2e4 ponder e7e5
      if (line.startsWith('bestmove ')) {
        const bestMoveMatch = line.match(/^bestmove\s+(\S+)/);
        if (bestMoveMatch) {
          const move = bestMoveMatch[1];
          setBestMove(move);
          setIsThinking(false);
          setEngineStatus('ready');
          
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
          }

          if (onMoveCallback) {
            onMoveCallback(move);
          }
        }
      }
    };

    // Go command
    worker.postMessage(`go depth ${config.depth}`);

    // Set a safety timeout to stop Stockfish if it takes too long
    searchTimeoutRef.current = setTimeout(() => {
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
      }
    }, config.timeLimit) as unknown as number;

  }, [initWorker, stopSearch]);

  // Perform deeper analysis for the "Analyze" button
  const analyzePosition = useCallback((fen: string) => {
    const worker = initWorker();
    if (!worker) return;

    stopSearch();
    setIsThinking(true);
    setBestMove(null);
    setEngineStatus('analyzing');

    const isBlackTurn = fen.split(' ')[1] === 'b';

    // Set master difficulty options for analysis
    worker.postMessage('setoption name Skill Level value 20');
    worker.postMessage(`position fen ${fen}`);

    worker.onmessage = (event: MessageEvent) => {
      const line: string = event.data;

      if (line.startsWith('info ')) {
        const depthMatch = line.match(/depth (\d+)/);
        if (depthMatch) {
          setEngineDepth(parseInt(depthMatch[1], 10));
        }

        const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
        if (scoreMatch) {
          const type = scoreMatch[1] as 'cp' | 'mate';
          let value = parseInt(scoreMatch[2], 10);
          if (isBlackTurn) {
            value = -value;
          }
          setEvaluation({
            type,
            value: type === 'cp' ? value / 100 : value,
          });
        }
      }

      if (line.startsWith('bestmove ')) {
        const bestMoveMatch = line.match(/^bestmove\s+(\S+)/);
        if (bestMoveMatch) {
          setBestMove(bestMoveMatch[1]);
          setIsThinking(false);
          setEngineStatus('ready');
        }
      }
    };

    // Perform analysis up to depth 15 (grandmaster level)
    worker.postMessage('go depth 15');
    
    // Auto-stop after 3 seconds if not completed
    searchTimeoutRef.current = setTimeout(() => {
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
      }
    }, 3000) as unknown as number;

  }, [initWorker, stopSearch]);

  // Clean up on component destroy
  useEffect(() => {
    return () => terminateWorker();
  }, [terminateWorker]);

  return {
    evaluation,
    bestMove,
    isThinking,
    engineStatus,
    engineDepth,
    getEngineMove,
    analyzePosition,
    stopSearch,
    terminateWorker
  };
}
