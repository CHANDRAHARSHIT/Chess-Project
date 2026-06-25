import type { FenPieceString, PositionDataType } from 'react-chessboard';
import { Chess } from 'chess.js';
import { generateChess960FEN } from './chess960';

export type EditorPieceCode = `w${Uppercase<FenPieceString>}` | `b${Uppercase<FenPieceString>}`;
export type EditorTool = EditorPieceCode | 'erase';
export type ActiveColor = 'w' | 'b';
export type CastlingFlag = 'K' | 'Q' | 'k' | 'q';

export interface EditorCastlingRights {
  K: boolean;
  Q: boolean;
  k: boolean;
  q: boolean;
}

export interface EditorPositionState {
  position: PositionDataType;
  activeColor: ActiveColor;
  castlingRights: EditorCastlingRights;
  enPassant: string;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;
const STANDARD_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function fenCharToPieceCode(char: FenPieceString): EditorPieceCode {
  const color = char === char.toUpperCase() ? 'w' : 'b';
  return `${color}${char.toUpperCase() as Uppercase<FenPieceString>}`;
}

function pieceCodeToFenChar(pieceCode: string): FenPieceString {
  const piece = pieceCode[1];
  return (pieceCode[0] === 'w' ? piece.toUpperCase() : piece.toLowerCase()) as FenPieceString;
}

function getSquare(fileIndex: number, rankIndex: number): string {
  return `${FILES[fileIndex]}${RANKS[rankIndex]}`;
}

function squareToCoords(square: string) {
  return {
    file: square.charCodeAt(0) - 97,
    rank: Number(square[1]) - 1,
  };
}

function coordsToSquare(file: number, rank: number): string | null {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${FILES[file]}${rank + 1}`;
}

function getKingSquare(position: PositionDataType, color: 'w' | 'b'): string | null {
  for (const [square, piece] of Object.entries(position)) {
    if (piece.pieceType === `${color}K`) return square;
  }
  return null;
}

function isSlidingAttack(
  position: PositionDataType,
  fromSquare: string,
  targetSquare: string,
  directions: Array<[number, number]>
): boolean {
  const from = squareToCoords(fromSquare);

  for (const [fileStep, rankStep] of directions) {
    let file = from.file + fileStep;
    let rank = from.rank + rankStep;

    while (file >= 0 && file <= 7 && rank >= 0 && rank <= 7) {
      const square = coordsToSquare(file, rank);
      if (!square) break;
      if (square === targetSquare) return true;
      if (position[square]) break;
      file += fileStep;
      rank += rankStep;
    }
  }

  return false;
}

function isSquareAttacked(
  position: PositionDataType,
  targetSquare: string,
  attackerColor: 'w' | 'b'
): boolean {
  const target = squareToCoords(targetSquare);

  for (const [square, piece] of Object.entries(position)) {
    if (piece.pieceType[0] !== attackerColor) continue;

    const from = squareToCoords(square);
    const fileDiff = target.file - from.file;
    const rankDiff = target.rank - from.rank;
    const absFileDiff = Math.abs(fileDiff);
    const absRankDiff = Math.abs(rankDiff);
    const pieceType = piece.pieceType[1];

    if (pieceType === 'P') {
      const forward = attackerColor === 'w' ? 1 : -1;
      if (rankDiff === forward && absFileDiff === 1) return true;
    }

    if (pieceType === 'N') {
      if (
        (absFileDiff === 1 && absRankDiff === 2) ||
        (absFileDiff === 2 && absRankDiff === 1)
      ) {
        return true;
      }
    }

    if (pieceType === 'K') {
      if (Math.max(absFileDiff, absRankDiff) === 1) return true;
    }

    if (pieceType === 'B' || pieceType === 'Q') {
      if (
        isSlidingAttack(position, square, targetSquare, [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ])
      ) {
        return true;
      }
    }

    if (pieceType === 'R' || pieceType === 'Q') {
      if (
        isSlidingAttack(position, square, targetSquare, [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ])
      ) {
        return true;
      }
    }
  }

  return false;
}

function getCastlingRights(castlingField: string): EditorCastlingRights {
  return {
    K: castlingField.includes('K'),
    Q: castlingField.includes('Q'),
    k: castlingField.includes('k'),
    q: castlingField.includes('q'),
  };
}

export function parseFenToEditorState(fen: string): EditorPositionState {
  const [placement = '8/8/8/8/8/8/8/8', activeColor = 'w', castling = '-', enPassant = '-'] =
    fen.split(' ');
  const rows = placement.split('/');
  const position: PositionDataType = {};

  rows.forEach((row, rankIndex) => {
    let fileIndex = 0;

    for (const token of row) {
      if (/\d/.test(token)) {
        fileIndex += Number(token);
        continue;
      }

      const square = getSquare(fileIndex, rankIndex);
      position[square] = { pieceType: fenCharToPieceCode(token as FenPieceString) };
      fileIndex += 1;
    }
  });

  return {
    position,
    activeColor: activeColor === 'b' ? 'b' : 'w',
    castlingRights: getCastlingRights(castling),
    enPassant,
  };
}

export function buildFenFromEditorState(state: EditorPositionState): string {
  const placement = RANKS.map((_, rankIndex) => {
    let row = '';
    let emptySquares = 0;

    FILES.forEach((_, fileIndex) => {
      const square = getSquare(fileIndex, rankIndex);
      const piece = state.position[square];

      if (!piece) {
        emptySquares += 1;
        return;
      }

      if (emptySquares > 0) {
        row += String(emptySquares);
        emptySquares = 0;
      }

      row += pieceCodeToFenChar(piece.pieceType);
    });

    if (emptySquares > 0) {
      row += String(emptySquares);
    }

    return row;
  }).join('/');

  const castling = (['K', 'Q', 'k', 'q'] as CastlingFlag[])
    .filter((flag) => state.castlingRights[flag])
    .join('') || '-';

  return `${placement} ${state.activeColor} ${castling} ${normalizeEnPassant(state.enPassant)} 0 1`;
}

export function normalizeEnPassant(square: string): string {
  const normalized = square.trim().toLowerCase();
  if (normalized === '' || normalized === '-') return '-';
  return normalized;
}

export function validateEditorPosition(state: EditorPositionState): string | null {
  const pieces = Object.values(state.position);
  const whiteKings = pieces.filter((piece) => piece.pieceType === 'wK').length;
  const blackKings = pieces.filter((piece) => piece.pieceType === 'bK').length;

  if (whiteKings !== 1) return 'Position must contain exactly one white king.';
  if (blackKings !== 1) return 'Position must contain exactly one black king.';

  for (const [square, piece] of Object.entries(state.position)) {
    if (piece.pieceType[1] === 'P' && (square.endsWith('1') || square.endsWith('8'))) {
      return 'Pawns cannot be on first or eighth rank.';
    }
  }

  const enPassant = normalizeEnPassant(state.enPassant);
  if (enPassant !== '-' && !/^[a-h][36]$/.test(enPassant)) {
    return 'En passant target must be "-" or a valid square like e3 or d6.';
  }

  const whiteKingSquare = getKingSquare(state.position, 'w');
  const blackKingSquare = getKingSquare(state.position, 'b');

  if (!whiteKingSquare || !blackKingSquare) {
    return 'Both kings must be present on the board.';
  }

  const whiteKing = squareToCoords(whiteKingSquare);
  const blackKing = squareToCoords(blackKingSquare);

  if (
    Math.max(
      Math.abs(whiteKing.file - blackKing.file),
      Math.abs(whiteKing.rank - blackKing.rank)
    ) <= 1
  ) {
    return 'Kings cannot be placed on adjacent squares.';
  }

  const whiteInCheck = isSquareAttacked(state.position, whiteKingSquare, 'b');
  const blackInCheck = isSquareAttacked(state.position, blackKingSquare, 'w');

  if (whiteInCheck && blackInCheck) {
    return 'Both kings cannot be in check at the same time.';
  }

  if ((state.activeColor === 'w' && blackInCheck) || (state.activeColor === 'b' && whiteInCheck)) {
    return 'Side not to move cannot already be in check.';
  }

  const fen = buildFenFromEditorState(state);

  try {
    const chess = new Chess();
    chess.load(fen);
  } catch {
    return 'Invalid chess position.';
  }

  return null;
}

export function setPieceOnSquare(
  position: PositionDataType,
  square: string,
  tool: EditorTool
): PositionDataType {
  const nextPosition = { ...position };

  if (tool === 'erase') {
    delete nextPosition[square];
    return nextPosition;
  }

  nextPosition[square] = { pieceType: tool };
  return nextPosition;
}

export function movePieceBetweenSquares(
  position: PositionDataType,
  sourceSquare: string,
  targetSquare: string
): PositionDataType {
  const piece = position[sourceSquare];
  if (!piece || sourceSquare === targetSquare) return position;

  const nextPosition = { ...position };
  delete nextPosition[sourceSquare];
  nextPosition[targetSquare] = piece;
  return nextPosition;
}

export function createEmptyEditorState(): EditorPositionState {
  return {
    position: {},
    activeColor: 'w',
    castlingRights: { K: false, Q: false, k: false, q: false },
    enPassant: '-',
  };
}

export function createStandardEditorState(): EditorPositionState {
  return parseFenToEditorState(STANDARD_START_FEN);
}

export function createChess960EditorState(): EditorPositionState {
  return parseFenToEditorState(generateChess960FEN());
}

function mirrorSquareVertically(square: string): string {
  const file = square[0];
  const rank = Number(square[1]);

  if (!/^[a-h]$/.test(file) || Number.isNaN(rank) || rank < 1 || rank > 8) {
    return square;
  }

  return `${file}${9 - rank}`;
}

function swapPieceColor(pieceCode: EditorPieceCode): EditorPieceCode {
  const nextColor = pieceCode[0] === 'w' ? 'b' : 'w';
  return `${nextColor}${pieceCode[1]}` as EditorPieceCode;
}

export function switchEditorSides(state: EditorPositionState): EditorPositionState {
  const nextPosition: PositionDataType = {};

  // Mirror each piece to the opposite rank and swap piece colors.
  for (const [square, piece] of Object.entries(state.position)) {
    const mirroredSquare = mirrorSquareVertically(square);
    nextPosition[mirroredSquare] = {
      pieceType: swapPieceColor(piece.pieceType as EditorPieceCode),
    };
  }

  const normalizedEnPassant = normalizeEnPassant(state.enPassant);
  const mirroredEnPassant =
    normalizedEnPassant === '-' ? '-' : mirrorSquareVertically(normalizedEnPassant);

  return {
    position: nextPosition,
    activeColor: state.activeColor === 'w' ? 'b' : 'w',
    castlingRights: {
      K: state.castlingRights.k,
      Q: state.castlingRights.q,
      k: state.castlingRights.K,
      q: state.castlingRights.Q,
    },
    enPassant: mirroredEnPassant,
  };
}
