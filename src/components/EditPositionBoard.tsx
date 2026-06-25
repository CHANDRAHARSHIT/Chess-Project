import { useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard, defaultPieces, type PositionDataType } from 'react-chessboard';
import { getSquareFromPointer, type BoardOrientation } from '../utils/editModeInteraction';
import {
  movePieceBetweenSquares,
  setPieceOnSquare,
  type EditorPieceCode,
  type EditorTool,
} from '../utils/positionEditor';

const BOARD_DARK = '#769656';
const BOARD_LIGHT = '#EEEED2';
const FILE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANK_LABELS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

interface DragState {
  pointerId: number;
  sourceSquare: string;
  pieceCode: EditorPieceCode;
  clientX: number;
  clientY: number;
  hoveredSquare: string | null;
}

interface EditPositionBoardProps {
  position: PositionDataType;
  selectedTool: EditorTool | null;
  boardOrientation: BoardOrientation;
  onPositionChange: (position: PositionDataType) => void;
}

export function EditPositionBoard({
  position,
  selectedTool,
  boardOrientation,
  onPositionChange,
}: EditPositionBoardProps) {
  const boardFrameRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    setDragState(null);
  }, [position]);

  const squareStyles = useMemo(() => {
    if (!dragState) return {};

    const styles: Record<string, React.CSSProperties> = {
      [dragState.sourceSquare]: {
        boxShadow: 'inset 0 0 0 5px rgba(96, 165, 250, 0.95)',
        backgroundImage:
          'radial-gradient(circle, rgba(96, 165, 250, 0.18), transparent 68%)',
      },
    };

    if (dragState.hoveredSquare && dragState.hoveredSquare !== dragState.sourceSquare) {
      styles[dragState.hoveredSquare] = {
        backgroundColor: 'rgba(74, 222, 128, 0.30)',
      };
    }

    return styles;
  }, [dragState]);

  const getBoardRect = () => boardFrameRef.current?.getBoundingClientRect() ?? null;

  const getHoverSquare = (clientX: number, clientY: number) => {
    const boardRect = getBoardRect();
    if (!boardRect) return null;

    return getSquareFromPointer(clientX, clientY, boardRect, boardOrientation);
  };

  const handlePointerDown = (
    square: string,
    pieceCode: EditorPieceCode | undefined,
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (dragState) return;
    if (selectedTool) return;
    if (!pieceCode) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    setDragState({
      pointerId: event.pointerId,
      sourceSquare: square,
      pieceCode,
      clientX: event.clientX,
      clientY: event.clientY,
      hoveredSquare: square,
    });
  };

  const updateDragPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    event.preventDefault();

    setDragState((current) => {
      if (!current || current.pointerId !== event.pointerId) return current;

      return {
        ...current,
        clientX: event.clientX,
        clientY: event.clientY,
        hoveredSquare: getHoverSquare(event.clientX, event.clientY),
      };
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>, canceled = false) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    event.preventDefault();

    const targetSquare = canceled ? null : getHoverSquare(event.clientX, event.clientY);

    if (targetSquare) {
      onPositionChange(
        movePieceBetweenSquares(position, dragState.sourceSquare, targetSquare)
      );
    }

    setDragState(null);
  };

  const placeTool = (square: string) => {
    if (!selectedTool) return;

    onPositionChange(setPieceOnSquare(position, square, selectedTool));
  };

  const fileLabels = boardOrientation === 'white' ? FILE_LABELS : [...FILE_LABELS].reverse();
  const rankLabels = boardOrientation === 'white' ? [...RANK_LABELS].reverse() : RANK_LABELS;

  return (
    <div
      ref={boardFrameRef}
      className="relative aspect-square w-full max-w-[820px] mx-auto overflow-hidden rounded-xl border border-brand-border shadow-xl touch-none select-none"
    >
      <Chessboard
        options={{
          position,
          allowDragging: false,
          boardOrientation,
          squareRenderer: ({ square, piece, children }) => {
            const boardPiece = piece?.pieceType as EditorPieceCode | undefined;
            const isSourceSquare = dragState?.sourceSquare === square;
            const isDraggingSource = Boolean(dragState) && isSourceSquare;

            return (
              <div
                role="button"
                tabIndex={0}
                aria-label={`Edit square ${square}`}
                onPointerDown={(event) => handlePointerDown(square, boardPiece, event)}
                onPointerMove={updateDragPointer}
                onPointerUp={(event) => {
                  if (dragState) {
                    endDrag(event);
                    return;
                  }

                  if (selectedTool) {
                    if (event.pointerType === 'mouse' && event.button !== 0) return;
                    event.preventDefault();
                    placeTool(square);
                  }
                }}
                onPointerCancel={(event) => endDrag(event, true)}
                onContextMenu={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                  if (!selectedTool || (event.key !== 'Enter' && event.key !== ' ')) return;
                  event.preventDefault();
                  placeTool(square);
                }}
                style={{ width: '100%', height: '100%', touchAction: 'none', userSelect: 'none' }}
              >
                <div style={{ width: '100%', height: '100%', opacity: isDraggingSource ? 0 : 1 }}>
                  {children}
                </div>
              </div>
            );
          },
          squareStyles,
          darkSquareStyle: { backgroundColor: BOARD_DARK },
          lightSquareStyle: { backgroundColor: BOARD_LIGHT },
          boardStyle: { borderRadius: '0px', touchAction: 'none', userSelect: 'none' },
          showNotation: false,
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute bottom-1.5 left-2 right-2 grid grid-cols-8 text-[10px] font-semibold uppercase tracking-[0.08em] text-black/35">
          {fileLabels.map((file) => (
            <span key={file} className="justify-self-center">
              {file}
            </span>
          ))}
        </div>

        <div className="absolute left-1.5 top-2 bottom-2 grid grid-rows-8 text-[10px] font-semibold text-black/35">
          {rankLabels.map((rank) => (
            <span key={rank} className="self-center">
              {rank}
            </span>
          ))}
        </div>
      </div>

      {dragState && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: dragState.clientX,
            top: dragState.clientY,
            width: 'clamp(48px, 8vw, 72px)',
            height: 'clamp(48px, 8vw, 72px)',
            transform: 'translate(-50%, -50%) scale(1.1)',
            opacity: 0.95,
            filter: 'drop-shadow(0 16px 26px rgba(0, 0, 0, 0.45))',
          }}
        >
          {(() => {
            const PieceSvg = defaultPieces[dragState.pieceCode];

            return (
              <div className="h-full w-full">
                <PieceSvg />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
