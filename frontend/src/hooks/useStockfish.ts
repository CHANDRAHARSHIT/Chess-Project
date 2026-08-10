import { useEffect, useRef, useState, useCallback } from 'react';
import { type DifficultyLevel, type EngineEvaluation, DIFFICULTY_CONFIGS, type EngineStatus } from '../types/chess';
import rollbar from '../config/rollbar';

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [evaluation, setEvaluation] = useState<EngineEvaluation>({ type: 'cp', value: 0 });
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  // Mirrors isThinking without changing identity on every think/idle flip —
  // stopSearch/getEngineMove read this instead of the state value so their
  // own useCallback identities stay stable (see invalidateSearch below).
  const isThinkingRef = useRef(false);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('idle');
  const [engineDepth, setEngineDepth] = useState<number>(0);

  // Keep track of search timeout to clear if game resets or new move is made
  const searchTimeoutRef = useRef<number | null>(null);
  // Bumped every time a search is stopped or superseded. A search's onmessage
  // handler captures the id at launch time and ignores any Stockfish message
  // that arrives after the id has moved on — this is what prevents a late
  // 'bestmove' for an old position from being applied to a board that has
  // since been reset/undone/reshuffled.
  const searchIdRef = useRef(0);

  const setThinking = useCallback((value: boolean) => {
    isThinkingRef.current = value;
    setIsThinking(value);
  }, []);

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
      // Falls back to an "error" engine status below, so this never reaches
      // the ErrorBoundary — report it manually since it breaks engine play.
      rollbar.error(e as Error, { context: 'useStockfish.initWorker' });
      setEngineStatus('error');
      return null;
    }
  }, []);

  // Cancels whatever search is currently in flight. Any onmessage handler
  // still bound from that search will see searchIdRef has moved past its
  // captured id and drop late 'info'/'bestmove' messages instead of acting
  // on them against a board that has since moved on (reset/undo/etc).
  const invalidateSearch = useCallback(() => {
    searchIdRef.current += 1;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    return searchIdRef.current;
  }, []);

  // Terminate worker
  const terminateWorker = useCallback(() => {
    invalidateSearch();
    if (workerRef.current) {
      workerRef.current.onmessage = null;
      workerRef.current.postMessage('quit');
      workerRef.current.terminate();
      workerRef.current = null;
      setEngineStatus('idle');
      setThinking(false);
    }
  }, [invalidateSearch, setThinking]);

  // Stop current search
  const stopSearch = useCallback(() => {
    invalidateSearch();
    if (workerRef.current && isThinkingRef.current) {
      workerRef.current.postMessage('stop');
    }
    setThinking(false);
  }, [invalidateSearch, setThinking]);

  // Reset evaluation state to starting position (used by handleReset)
  const resetEvaluation = useCallback(() => {
    setEvaluation({ type: 'cp', value: 0 });
    setBestMove(null);
    setEngineDepth(0);
    setThinking(false);
  }, [setThinking]);

  // Start search for a FEN position
  const getEngineMove = useCallback((fen: string, difficulty: DifficultyLevel, onMoveCallback?: (move: string) => void, isChess960?: boolean) => {
    const worker = initWorker();
    if (!worker) return;

    // Cancel any ongoing search and claim a fresh id for this one
    const thisSearchId = invalidateSearch();
    setThinking(true);
    setBestMove(null);
    setEngineStatus('thinking');

    const config = DIFFICULTY_CONFIGS[difficulty];
    const isBlackTurn = fen.split(' ')[1] === 'b';

    // Configure options
    if (isChess960) {
      // CDN Stockfish 10.0.2 does not support UCI_Chess960 option
    }
    worker.postMessage(`setoption name Skill Level value ${config.skillLevel}`);
    worker.postMessage(`position fen ${fen}`);

    // Set message listener
    worker.onmessage = (event: MessageEvent) => {
      // A newer search superseded this one (stop/reset/undo/new move) —
      // ignore this message so its callback never fires against a stale board.
      if (thisSearchId !== searchIdRef.current) return;

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
          setThinking(false);
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
      if (thisSearchId === searchIdRef.current) {
        workerRef.current?.postMessage('stop');
      }
    }, config.timeLimit) as unknown as number;

  }, [initWorker, invalidateSearch, setThinking]);

  // Perform deeper analysis for the "Hint" button
  const analyzePosition = useCallback((fen: string, strength?: number, isChess960?: boolean) => {
    const worker = initWorker();
    if (!worker) return;

    const thisSearchId = invalidateSearch();
    setThinking(true);
    setBestMove(null);
    setEngineStatus('analyzing');

    const isBlackTurn = fen.split(' ')[1] === 'b';

    // Map strength (e.g. 2000, 2500, 3200) to Stockfish skill and depth
    let skill = 20;
    let depth = 15;
    if (strength === 2000) { skill = 10; depth = 10; }
    else if (strength === 2500) { skill = 15; depth = 12; }
    else if (strength && strength >= 3000) { skill = 20; depth = 18; }

    // Set master difficulty options for analysis
    if (isChess960) {
      // CDN Stockfish 10.0.2 does not support UCI_Chess960 option
    }
    worker.postMessage(`setoption name Skill Level value ${skill}`);
    worker.postMessage(`position fen ${fen}`);

    worker.onmessage = (event: MessageEvent) => {
      if (thisSearchId !== searchIdRef.current) return;

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
          setThinking(false);
          setEngineStatus('ready');
        }
      }
    };

    // Perform analysis up to calculated depth
    worker.postMessage(`go depth ${depth}`);

    // Auto-stop after 3 seconds if not completed
    searchTimeoutRef.current = setTimeout(() => {
      if (thisSearchId === searchIdRef.current) {
        workerRef.current?.postMessage('stop');
      }
    }, 3000) as unknown as number;

  }, [initWorker, invalidateSearch, setThinking]);

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
    resetEvaluation,
    terminateWorker
  };
}
