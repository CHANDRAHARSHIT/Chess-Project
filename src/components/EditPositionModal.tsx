import { useEffect, useMemo, useRef, useState } from 'react';
import { defaultPieces } from 'react-chessboard';
import { ArrowLeftRight, Eraser, Home, Shuffle, Trash2, X } from 'lucide-react';
import {
  buildFenFromEditorState,
  createChess960EditorState,
  createEmptyEditorState,
  createStandardEditorState,
  parseFenToEditorState,
  switchEditorSides,
  type EditorPositionState,
  type EditorTool,
} from '../utils/positionEditor';
import { useStockfish } from '../hooks/useStockfish';
import { EvaluationBar } from './EvaluationBar';
import { EditPositionBoard } from './EditPositionBoard';
import type { BoardOrientation } from '../utils/editModeInteraction';

const PIECE_ROWS = [
  ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP'] as const,
  ['bK', 'bQ', 'bR', 'bB', 'bN', 'bP'] as const,
] as const;

interface EditPositionModalProps {
  initialFen: string;
  isOpen: boolean;
  boardOrientation: BoardOrientation;
  onApply: (fen: string) => void;
  onCancel: () => void;
  onValidate: (state: EditorPositionState) => string | null;
}

export function EditPositionModal({
  initialFen,
  isOpen,
  boardOrientation,
  onApply,
  onCancel,
  onValidate,
}: EditPositionModalProps) {
  const [editorState, setEditorState] = useState(() => parseFenToEditorState(initialFen));
  const [selectedTool, setSelectedTool] = useState<EditorTool | null>(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [boardSize, setBoardSize] = useState(720);

  const { evaluation, analyzePosition, stopSearch } = useStockfish();
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEditorState(parseFenToEditorState(initialFen));
    setSelectedTool(null);
    setLoadErrorMessage(null);
  }, [initialFen, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updateBoardSize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const availableHeight = Math.floor(viewportHeight * 0.92) - 24;
      const availableWidth = Math.max(320, viewportWidth - 480 - 48);
      setBoardSize(Math.max(320, Math.min(availableHeight, availableWidth)));
    };

    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);

    return () => window.removeEventListener('resize', updateBoardSize);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;

    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  const previewFen = useMemo(() => buildFenFromEditorState(editorState), [editorState]);

  useEffect(() => {
    if (!isOpen) {
      stopSearch();
      return;
    }

    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      analyzePosition(previewFen);
    }, 180);

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [analyzePosition, isOpen, previewFen, stopSearch]);

  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      stopSearch();
    };
  }, [stopSearch]);

  if (!isOpen) return null;

  const selectTool = (tool: EditorTool) => {
    setSelectedTool((current) => (current === tool ? null : tool));
    setLoadErrorMessage(null);
  };

  const updatePosition = (position: EditorPositionState['position']) => {
    setEditorState((current) => ({ ...current, position }));
    setLoadErrorMessage(null);
  };

  const handleLoad = () => {
    const validationError = onValidate(editorState);
    if (validationError) {
      setLoadErrorMessage(validationError);
      return;
    }

    onApply(previewFen);
  };

  const handleLoadPreset = (nextState: EditorPositionState) => {
    setEditorState(nextState);
    setSelectedTool(null);
    setLoadErrorMessage(null);
  };

  const handleSwitchSides = () => {
    setEditorState((current) => switchEditorSides(current));
    setSelectedTool(null);
    setLoadErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-brand-bg/85 px-3 py-3 backdrop-blur-sm">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] max-h-[calc(100vh-1.5rem)] max-w-[1460px] items-stretch">
        <div className="relative flex h-full w-full overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-2xl">
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 z-20 rounded-md border border-brand-border bg-brand-bg/80 p-2 text-brand-secondary transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close editor"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 xl:grid-cols-[auto_minmax(0,1fr)_minmax(340px,420px)]">
            <div className="flex min-h-0 items-stretch border-b border-brand-border bg-brand-bg/35 px-3 py-3 xl:border-b-0 xl:border-r xl:border-brand-border/80">
              <EvaluationBar evaluation={evaluation} isDesktop boardHeight={boardSize} />
            </div>

            <div className="flex min-h-0 items-center justify-center border-b border-brand-border px-3 py-3 xl:border-b-0 xl:border-r xl:border-brand-border/80">
              <EditPositionBoard
                position={editorState.position}
                selectedTool={selectedTool}
                boardOrientation={boardOrientation}
                onPositionChange={updatePosition}
                boardSize={boardSize}
              />
            </div>

            <div className="min-h-0 overflow-hidden px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
                <div className="grid grid-cols-1 gap-2">
                  {PIECE_ROWS.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="grid grid-cols-6 gap-1.5 rounded-xl border border-brand-border bg-brand-bg/50 p-1.5"
                    >
                      {row.map((pieceCode) => {
                        const PieceSvg = defaultPieces[pieceCode];
                        const isSelected = selectedTool === pieceCode;

                        return (
                          <button
                            key={pieceCode}
                            onClick={() => selectTool(pieceCode)}
                            className={`flex aspect-square items-center justify-center rounded-lg border transition-all ${
                              isSelected
                                ? 'border-purple-400 bg-purple-400/15 text-white shadow-[0_0_0_1px_rgba(192,132,252,0.45),0_0_24px_rgba(192,132,252,0.22)] scale-105'
                                : 'border-brand-border bg-brand-bg text-brand-secondary hover:bg-white/5 hover:text-white'
                            }`}
                            title={pieceCode}
                          >
                            <span className="h-8 w-8">
                              <PieceSvg />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => selectTool('erase')}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                    selectedTool === 'erase'
                      ? 'border-purple-400 bg-purple-400/15 text-white shadow-[0_0_0_1px_rgba(192,132,252,0.45),0_0_24px_rgba(192,132,252,0.22)] scale-[1.02]'
                      : 'border-brand-border bg-brand-bg text-brand-secondary hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Eraser className="w-4 h-4" />
                  Eraser
                </button>

                <section className="grid min-h-0 flex-1 gap-2 overflow-hidden xl:grid-rows-[auto_auto_1fr_auto]">
                  <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-2.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['w', 'b'] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setEditorState((current) => ({ ...current, activeColor: color }));
                            setLoadErrorMessage(null);
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                            editorState.activeColor === color
                              ? 'border-brand-accent bg-brand-accent/15 text-white'
                              : 'border-brand-border bg-brand-bg text-brand-secondary hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {color === 'w' ? 'White to move' : 'Black to move'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-2.5">
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['K', 'Q', 'k', 'q'] as const).map((flag) => (
                        <button
                          key={flag}
                          onClick={() => {
                            setEditorState((current) => ({
                              ...current,
                              castlingRights: {
                                ...current.castlingRights,
                                [flag]: !current.castlingRights[flag],
                              },
                            }));
                            setLoadErrorMessage(null);
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all ${
                            editorState.castlingRights[flag]
                              ? 'border-brand-accent bg-brand-accent/15 text-white'
                              : 'border-brand-border bg-brand-bg text-brand-secondary hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {flag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-bg/50 p-2.5">
                    <div
                      className="break-words font-mono text-[11px] leading-4 text-white"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {previewFen}
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-2.5 space-y-2">
                    <button
                      onClick={() => handleLoadPreset(createEmptyEditorState())}
                      className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm font-medium text-brand-secondary transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Trash2 className="mr-2 inline-block h-4 w-4 align-[-2px]" />
                      Clear
                    </button>

                    <button
                      onClick={() => handleLoadPreset(createStandardEditorState())}
                      className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm font-medium text-brand-secondary transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Home className="mr-2 inline-block h-4 w-4 align-[-2px]" />
                      Starting Position
                    </button>

                    <button
                      onClick={() => handleLoadPreset(createChess960EditorState())}
                      className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm font-medium text-brand-secondary transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Shuffle className="mr-2 inline-block h-4 w-4 align-[-2px]" />
                      Shuffle
                    </button>

                    <button
                      onClick={handleSwitchSides}
                      className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm font-medium text-brand-secondary transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <ArrowLeftRight className="mr-2 inline-block h-4 w-4 align-[-2px]" />
                      Switch Sides
                    </button>
                  </div>

                  <div className="flex items-end justify-end pt-0.5">
                    <button
                      onClick={handleLoad}
                      className="w-full rounded-lg bg-brand-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-accent/90"
                    >
                      Load
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loadErrorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/55"
            onClick={() => setLoadErrorMessage(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-red-500/40 bg-brand-surface/95 p-5 text-red-100 shadow-[0_0_40px_rgba(239,68,68,0.22)] backdrop-blur-md animate-fade-in">
            <button
              onClick={() => setLoadErrorMessage(null)}
              className="absolute right-3 top-3 rounded-md p-1 text-red-200/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pr-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-300/90">Invalid Position</p>
              <p className="mt-2 text-sm leading-6 text-red-100">{loadErrorMessage}</p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setLoadErrorMessage(null)}
                className="rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-500/25"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
