export type BoardOrientation = 'white' | 'black';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

export interface BoardRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function getSquareFromPointer(
  clientX: number,
  clientY: number,
  boardRect: BoardRect,
  boardOrientation: BoardOrientation
): string | null {
  const size = Math.min(boardRect.width, boardRect.height);
  if (size <= 0) return null;

  const relativeX = clientX - boardRect.left;
  const relativeY = clientY - boardRect.top;

  if (relativeX < 0 || relativeY < 0 || relativeX >= size || relativeY >= size) {
    return null;
  }

  const squareSize = size / 8;
  const fileIndex = Math.floor(relativeX / squareSize);
  const rankIndex = Math.floor(relativeY / squareSize);

  if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) {
    return null;
  }

  const boardFile = boardOrientation === 'white' ? fileIndex : 7 - fileIndex;
  const boardRank = boardOrientation === 'white' ? rankIndex : 7 - rankIndex;

  return `${FILES[boardFile]}${RANKS[boardRank]}`;
}
