import React, { useMemo } from 'react';
import { ThemedChessboard } from '../ThemedChessboard';
import { BoardCoordinates } from '../BoardCoordinates';
import { type GameStatus } from '../../types/chess';

interface GameBoardProps {
  fen: string;
  boardOrientation: 'white' | 'black';
  onPieceDrop: (from: string, to: string) => boolean;
  lastMove: { from: string; to: string } | null;
  hintSquare: string | null;
  status: GameStatus;
  isInteractive: boolean;
}

export function GameBoard({
  fen,
  boardOrientation,
  onPieceDrop,
  lastMove,
  hintSquare,
  status,
  isInteractive,
}: GameBoardProps) {
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(212, 175, 110, 0.35)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(212, 175, 110, 0.35)' };
    }

    if (hintSquare) {
      styles[hintSquare] = {
        boxShadow: 'inset 0 0 0 4px rgba(34, 197, 94, 0.85)',
        borderRadius: '4px',
      };
    }

    return styles;
  }, [lastMove, hintSquare]);

  const borderClass =
    status === 'checkmate'
      ? 'border-emerald-500 ring-4 ring-emerald-500/25'
      : status === 'resigned' || status === 'stalemate' || status === 'draw'
        ? 'border-amber-500/80 ring-4 ring-amber-500/20'
        : 'border-brand-border/80';

  return (
    <div
      className={`relative w-full max-w-[480px] sm:max-w-[540px] aspect-square shadow-[0_20px_50px_rgba(212,175,110,0.03)] border overflow-hidden bg-brand-surface transition-all duration-300 ${borderClass}`}
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
  );
}
