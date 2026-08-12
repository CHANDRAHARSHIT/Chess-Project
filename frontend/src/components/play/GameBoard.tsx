import React, { useMemo } from 'react';
import { ThemedChessboard } from '../ThemedChessboard';
import { BoardCoordinates } from '../BoardCoordinates';
import { type GameStatus } from '../../types/chess';

interface GameBoardProps {
  fen: string;
  boardOrientation: 'white' | 'black';
  onPieceDrop: (from: string, to: string) => boolean;
  lastMove: { from: string; to: string } | null;
  hintSquare?: string | null;
  hintMove?: { from: string; to: string } | null;
  checkSquare?: string | null;
  status: GameStatus;
  isInteractive: boolean;
}

export function GameBoard({
  fen,
  boardOrientation,
  onPieceDrop,
  lastMove,
  hintSquare,
  hintMove,
  checkSquare,
  status,
  isInteractive,
}: GameBoardProps) {
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(212, 175, 110, 0.35)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(212, 175, 110, 0.35)' };
    }

    if (checkSquare) {
      styles[checkSquare] = {
        backgroundColor: 'rgba(239, 68, 68, 0.55)',
        boxShadow: 'inset 0 0 0 3px #ef4444, 0 0 14px rgba(239, 68, 68, 0.9)',
        borderRadius: '4px',
      };
    }

    if (hintMove) {
      styles[hintMove.from] = {
        backgroundColor: 'rgba(34, 197, 94, 0.35)',
        boxShadow: 'inset 0 0 0 3px #22c55e',
        borderRadius: '4px',
      };
      styles[hintMove.to] = {
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        boxShadow: 'inset 0 0 0 4px #10b981, 0 0 16px rgba(16, 185, 129, 0.6)',
        borderRadius: '4px',
      };
    } else if (hintSquare) {
      styles[hintSquare] = {
        boxShadow: 'inset 0 0 0 4px rgba(34, 197, 94, 0.85)',
        borderRadius: '4px',
      };
    }

    return styles;
  }, [lastMove, checkSquare, hintSquare, hintMove]);

  const borderClass =
    status === 'checkmate'
      ? 'border-emerald-500 ring-4 ring-emerald-500/30'
      : status === 'resigned' || status === 'stalemate' || status === 'draw'
        ? 'border-amber-500/80 ring-4 ring-amber-500/30'
        : 'border-brand-text/15';

  return (
    <div className="relative w-full h-full p-1 bg-brand-surface border border-brand-text/15">
      <div
        className={`relative w-full aspect-square border bg-brand-surface overflow-hidden transition-all duration-300 ${borderClass}`}
      >
        <ThemedChessboard
          options={{
            position: fen,
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              onPieceDrop(sourceSquare, targetSquare ?? ''),
            boardOrientation,
            squareStyles,
            boardStyle: { borderRadius: '0px' },
            showNotation: false,
            allowDragging: isInteractive && status === 'playing',
          }}
        />
        <BoardCoordinates boardOrientation={boardOrientation} />
      </div>
    </div>
  );
}
