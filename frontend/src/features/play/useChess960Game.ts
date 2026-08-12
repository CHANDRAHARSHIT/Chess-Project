/**
 * Stockfish Verification Results:
 * 1. UCI_Chess960 in uciok: false (CDN Stockfish 10.0.2 does not support UCI_Chess960 option string)
 * 2. Integration approach: FEN strings are loaded into Stockfish normally for positional evaluations;
 *    Chess960 castling gesture translation (king-onto-rook) is handled at the UI layer in onPieceDrop.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess, type Square } from 'chess.js';
import { useStockfish } from '@/shared/hooks/useStockfish';
import { type DifficultyLevel, type GameStatus, type GameResult } from '@/shared/chess/chess.types';
import { generateChess960FEN } from '@/shared/chess/chess960';
import { parseUciMove, playMoveSound } from '@/shared/chess/chessHelpers';
import { soundManager } from '@/shared/lib/SoundManager';
import rollbar from '@/shared/lib/rollbar';

export interface Chess960GameOptions {
  playerColor: 'w' | 'b' | 'random';
  difficulty: DifficultyLevel;
}

export interface UseChess960GameReturn {
  fen: string;
  boardOrientation: 'white' | 'black';
  turn: 'w' | 'b';
  status: GameStatus;
  result: GameResult;
  moveHistory: ReturnType<Chess['history']>;
  lastMove: { from: string; to: string } | null;
  isEngineThinking: boolean;
  evaluation: ReturnType<typeof useStockfish>['evaluation'];
  difficulty: DifficultyLevel;
  playerColor: 'w' | 'b';
  hintSquare: string | null;
  hintMove: { from: string; to: string } | null;
  checkSquare: string | null;
  onPieceDrop: (sourceSquare: string, targetSquare: string) => boolean;
  startNewGame: (options: Chess960GameOptions) => void;
  resign: () => void;
  flipBoard: () => void;
  requestHint: () => void;
}

export function useChess960Game(): UseChess960GameReturn {
  const gameRef = useRef<Chess>(new Chess());
  const searchIdRef = useRef<number>(0);
  const hintTimeoutRef = useRef<number | null>(null);

  const {
    evaluation,
    bestMove,
    isThinking: isEngineThinking,
    getEngineMove,
    analyzePosition,
    stopSearch,
    resetEvaluation,
  } = useStockfish();

  const [fen, setFen] = useState<string>(() => generateChess960FEN());
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(3);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [result, setResult] = useState<GameResult>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [hintMove, setHintMove] = useState<{ from: string; to: string } | null>(null);
  const [isHintRequested, setIsHintRequested] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<ReturnType<Chess['history']>>([]);

  // Helper to process game over logic
  const handleGameOver = useCallback(() => {
    const game = gameRef.current;
    if (game.isCheckmate()) {
      setStatus('checkmate');
      setResult(game.turn() === 'w' ? 'black' : 'white');
    } else if (game.isStalemate()) {
      setStatus('stalemate');
      setResult('draw');
    } else if (game.isDraw()) {
      setStatus('draw');
      setResult('draw');
    }
    soundManager.playGameEnd();
  }, []);

  // Start new game setup
  const startNewGame = useCallback(
    (options: Chess960GameOptions) => {
      searchIdRef.current += 1;
      stopSearch();
      resetEvaluation();

      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = null;
      }
      setIsHintRequested(false);
      setHintSquare(null);
      setHintMove(null);

      const resolvedColor: 'w' | 'b' =
        options.playerColor === 'random'
          ? Math.random() < 0.5
            ? 'w'
            : 'b'
          : options.playerColor;

      setPlayerColor(resolvedColor);
      setBoardOrientation(resolvedColor === 'w' ? 'white' : 'black');
      setDifficulty(options.difficulty);

      const newFen = generateChess960FEN();
      gameRef.current = new Chess(newFen);
      setFen(newFen);
      setMoveHistory([]);
      setLastMove(null);
      setStatus('playing');
      setResult(null);
    },
    [stopSearch, resetEvaluation]
  );

  // Drag and drop piece move handler
  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (status !== 'playing') return false;

      const game = gameRef.current;
      if (game.turn() !== playerColor || isEngineThinking) return false;

      const sourcePiece = game.get(sourceSquare as Square);
      const targetPiece = game.get(targetSquare as Square);

      const isKing = sourcePiece?.type === 'k' && sourcePiece?.color === playerColor;
      const isOwnRook = targetPiece?.type === 'r' && targetPiece?.color === playerColor;

      let actualTarget = targetSquare;
      if (isKing && isOwnRook) {
        const kingFile = sourceSquare.charCodeAt(0);
        const rookFile = targetSquare.charCodeAt(0);
        const rank = sourceSquare[1];
        actualTarget = rookFile > kingFile ? `g${rank}` : `c${rank}`;
      }

      try {
        const move = game.move({
          from: sourceSquare as Square,
          to: actualTarget as Square,
          promotion: 'q',
        });

        if (!move) return false;

        if (hintTimeoutRef.current) {
          clearTimeout(hintTimeoutRef.current);
          hintTimeoutRef.current = null;
        }
        setIsHintRequested(false);
        setHintSquare(null);
        setHintMove(null);

        playMoveSound(game, move.flags, Boolean(move.captured));
        setFen(game.fen());
        setMoveHistory(game.history({ verbose: true }));
        setLastMove({ from: sourceSquare, to: actualTarget });

        if (game.isGameOver()) {
          handleGameOver();
        }

        return true;
      } catch {
        return false;
      }
    },
    [status, playerColor, isEngineThinking, handleGameOver]
  );

  // Trigger engine move when it's engine's turn with human breathing buffer delay
  useEffect(() => {
    if (status !== 'playing') return;

    const game = gameRef.current;
    if (game.turn() === playerColor || game.isGameOver() || isEngineThinking) return;

    const currentSearchId = searchIdRef.current;

    const timer = setTimeout(() => {
      getEngineMove(
        game.fen(),
        difficulty,
        (moveString: string) => {
          if (searchIdRef.current !== currentSearchId || status !== 'playing') return;

          const { from, to, promotion } = parseUciMove(moveString);
          try {
            const moveResult = game.move({
              from: from as Square,
              to: to as Square,
              promotion: promotion || 'q',
            });

            if (moveResult) {
              playMoveSound(game, moveResult.flags, Boolean(moveResult.captured));
              setFen(game.fen());
              setMoveHistory(game.history({ verbose: true }));
              setLastMove({ from, to });

              if (game.isGameOver()) {
                handleGameOver();
              }
            }
          } catch (e) {
            console.error('Failed to apply engine move:', moveString, e);
            // The engine returned an illegal/unparseable move — a real bug,
            // not user input, so report it manually.
            rollbar.error(e as Error, { context: 'useChess960Game.applyEngineMove', moveString });
          }
        },
        true
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [status, fen, playerColor, difficulty, isEngineThinking, getEngineMove, handleGameOver]);

  // Resign active game
  const resign = useCallback(() => {
    if (status !== 'playing') return;
    stopSearch();
    setStatus('resigned');
    setResult(playerColor === 'w' ? 'black' : 'white');
    soundManager.playGameEnd();
  }, [status, playerColor, stopSearch]);

  // Flip board view
  const flipBoard = useCallback(() => {
    setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  // Request hint from engine
  const requestHint = useCallback(() => {
    if (status !== 'playing' || isEngineThinking) return;
    setIsHintRequested(true);
    analyzePosition(gameRef.current.fen(), true);
  }, [status, isEngineThinking, analyzePosition]);

  // Update hint square & path when bestMove is received from analyzePosition
  useEffect(() => {
    if (bestMove && status === 'playing' && isHintRequested) {
      const from = bestMove.slice(0, 2);
      const to = bestMove.slice(2, 4);
      const timer = setTimeout(() => {
        setIsHintRequested(false);
        setHintSquare(from);
        setHintMove({ from, to });
      }, 0);

      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
      hintTimeoutRef.current = setTimeout(() => {
        setHintSquare(null);
        setHintMove(null);
      }, 4500) as unknown as number;

      return () => clearTimeout(timer);
    }
  }, [bestMove, status, isHintRequested]);

  // Calculate checkSquare for checked king
  const checkSquare = useMemo(() => {
    if (!fen) return null;
    const game = new Chess(fen);
    if (!game.inCheck()) return null;
    const turn = game.turn();
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          const file = String.fromCharCode(97 + c);
          const rank = String(8 - r);
          return `${file}${rank}`;
        }
      }
    }
    return null;
  }, [fen]);

  return {
    fen,
    boardOrientation,
    turn: (fen.split(' ')[1] as 'w' | 'b') || 'w',
    status,
    result,
    moveHistory,
    lastMove,
    isEngineThinking,
    evaluation,
    difficulty,
    playerColor,
    hintSquare,
    hintMove,
    checkSquare,
    onPieceDrop,
    startNewGame,
    resign,
    flipBoard,
    requestHint,
  };
}
