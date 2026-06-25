import { useEffect, useMemo, useState } from 'react';
import { defaultPieces } from 'react-chessboard';
import { ArrowLeftRight, Eraser, Home, Shuffle, Trash2, X } from 'lucide-react';
import {
  buildFenFromEditorState,
  createChess960EditorState,
  createEmptyEditorState,
  createStandardEditorState,
  normalizeEnPassant,
  parseFenToEditorState,
  switchEditorSides,
  type EditorPositionState,
  type EditorTool,
} from '../utils/positionEditor';
import { EditPositionBoard } from './EditPositionBoard';
import type { BoardOrientation } from '../utils/editModeInteraction';

const PIECE_GROUPS = [
  {
    label: 'White',
    pieces: ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP'] as const,
  },
  {
    label: 'Black',
    pieces: ['bK', 'bQ', 'bR', 'bB', 'bN', 'bP'] as const,
  },
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

  useEffect(() => {
    if (!isOpen) return;
    setEditorState(parseFenToEditorState(initialFen));
    setSelectedTool(null);
    setLoadErrorMessage(null);
  }, [initialFen, isOpen]);

  const previewFen = useMemo(() => buildFenFromEditorState(editorState), [editorState]);
  const activeCastling =
    (['K', 'Q', 'k', 'q'] as const).filter((flag) => editorState.castlingRights[flag]).join('') ||
    '-';

  if (!isOpen) return null;

  const updatePosition = (position: EditorPositionState['position']) => {
    setEditorState((current) => ({ ...current, position }));
    setLoadErrorMessage(null);
  };

  const selectTool = (tool: EditorTool) => {
    setSelectedTool((current) => (current === tool ? null : tool));
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
    <div className="fixed inset-0 z-40 bg-brand-bg/85 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="max-w-[1320px] mx-auto">
        <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
          <button
            onClick={onCancel}
            className="absolute right-6 top-6 z-10 rounded-md border border-brand-border bg-brand-bg/80 p-2 text-brand-secondary hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close editor"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] gap-0">
            <div className="p-4 sm:p-5 border-b xl:border-b-0 xl:border-r border-brand-border">
              <div className="flex items-stretch gap-3 lg:gap-4">
                <div
                  className="relative overflow-hidden rounded-lg border border-brand-border/80 bg-brand-bg/80 shrink-0"
                  style={{
                    width: '20px',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                  aria-hidden="true"
                >
                  <div className="h-1/2 w-full bg-white/80" />
                </div>

                <div className="min-w-0 flex-1">
                  <EditPositionBoard
                    position={editorState.position}
                    selectedTool={selectedTool}
                    boardOrientation={boardOrientation}
                    onPositionChange={updatePosition}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Piece Palette</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PIECE_GROUPS.map((group) => (
                    <div key={group.label} className="rounded-xl border border-brand-border bg-brand-bg/50 p-2.5">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-secondary/80">
                        {group.label}
                      </div>
                      <div className="mt-2.5 grid grid-cols-3 gap-2">
                        {group.pieces.map((pieceCode) => {
                          const PieceSvg = defaultPieces[pieceCode];
                          const isSelected = selectedTool === pieceCode;

                          return (
                            <button
                              key={pieceCode}
                              onClick={() => selectTool(pieceCode)}
                              className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2.5 transition-all ${
                                isSelected
                                  ? 'border-purple-400 bg-purple-400/15 text-white shadow-[0_0_0_1px_rgba(192,132,252,0.45),0_0_24px_rgba(192,132,252,0.22)] scale-105'
                                  : 'border-brand-border bg-brand-bg text-brand-secondary hover:bg-white/5 hover:text-white'
                              }`}
                              title={pieceCode}
                            >
                              <span className="w-8 h-8">
                                <PieceSvg />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => selectTool('erase')}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 transition-all ${
                    selectedTool === 'erase'
                      ? 'border-purple-400 bg-purple-400/15 text-white shadow-[0_0_0_1px_rgba(192,132,252,0.45),0_0_24px_rgba(192,132,252,0.22)] scale-[1.02]'
                      : 'border-brand-border bg-brand-bg text-brand-secondary hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Eraser className="w-4 h-4" />
                  Eraser
                </button>
              </section>

              <section className="rounded-xl border border-brand-border bg-brand-bg/50 p-3.5 space-y-3">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {(['w', 'b'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setEditorState((current) => ({ ...current, activeColor: color }));
                          setLoadErrorMessage(null);
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
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

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.18em] text-brand-secondary/80">
                    Castling rights
                  </label>
                  <div className="grid grid-cols-4 gap-2">
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
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                          editorState.castlingRights[flag]
                            ? 'border-brand-accent bg-brand-accent/15 text-white'
                            : 'border-brand-border bg-brand-bg text-brand-secondary hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {flag}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-brand-secondary">Current: {activeCastling}</div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="editor-en-passant"
                    className="text-xs font-medium uppercase tracking-[0.18em] text-brand-secondary/80"
                  >
                    En passant target
                  </label>
                  <input
                    id="editor-en-passant"
                    value={editorState.enPassant}
                    onChange={(event) => {
                      setEditorState((current) => ({
                        ...current,
                        enPassant: normalizeEnPassant(event.target.value),
                      }));
                      setLoadErrorMessage(null);
                    }}
                    placeholder="-"
                    className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-white placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
                  />
                  <div className="text-xs text-brand-secondary">Use "-", "e3", or "d6".</div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3.5 space-y-2.5">
                  <div className="rounded-lg border border-brand-border bg-brand-bg/60 px-3 py-2.5">
                    <div className="break-all font-mono text-xs text-white">{previewFen}</div>
                  </div>

                  <button
                    onClick={() => handleLoadPreset(createEmptyEditorState())}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm font-medium text-brand-secondary hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>

                  <button
                    onClick={() => handleLoadPreset(createStandardEditorState())}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm font-medium text-brand-secondary hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Starting Position
                  </button>

                  <button
                    onClick={() => handleLoadPreset(createChess960EditorState())}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm font-medium text-brand-secondary hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Shuffle className="w-4 h-4" />
                    Shuffle
                  </button>

                  <button
                    onClick={handleSwitchSides}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm font-medium text-brand-secondary hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Switch Sides
                  </button>
                </div>
              </section>

              <div className="flex items-center justify-end pt-0.5">
                <button
                  onClick={handleLoad}
                  className="w-full sm:w-auto rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent/90 transition-colors"
                >
                  Load
                </button>
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
              className="absolute right-3 top-3 rounded-md p-1 text-red-200/80 hover:bg-white/10 hover:text-white transition-colors"
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
                className="rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-500/25 transition-colors"
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
