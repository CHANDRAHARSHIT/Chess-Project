import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, Eraser, Home, Shuffle, Trash2, X } from 'lucide-react';
import {
  buildFenFromEditorState,
  createChess960EditorState,
  createEmptyEditorState,
  createStandardEditorState,
  parseFenToEditorState,
  type EditorPositionState,
  type EditorTool,
} from '../utils/positionEditor';
import { useStockfish } from '../hooks/useStockfish';
import { EvaluationBar } from './EvaluationBar';
import { EditPositionBoard } from './EditPositionBoard';
import type { BoardOrientation } from '../utils/editModeInteraction';
import { soundManager } from '../utils/SoundManager';
import { useBoardSettings } from '../hooks/useBoardSettings';

const PIECE_ROWS = [
  ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP'] as const,
  ['bK', 'bQ', 'bR', 'bB', 'bN', 'bP'] as const,
] as const;

interface EditPositionModalProps {
  initialFen: string;
  isOpen: boolean;
  boardOrientation: BoardOrientation;
  onSwitchSides: () => void;
  onApply: (fen: string) => void;
  onCancel: () => void;
  onValidate: (state: EditorPositionState) => string | null;
}

export function EditPositionModal({
  initialFen,
  isOpen,
  boardOrientation,
  onSwitchSides,
  onApply,
  onCancel,
  onValidate,
}: EditPositionModalProps) {
  const [editorState, setEditorState] = useState(() => parseFenToEditorState(initialFen));
  const [selectedTool, setSelectedTool] = useState<EditorTool | null>(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [boardSize, setBoardSize] = useState(720);
  const [isDesktopLayout, setIsDesktopLayout] = useState(() => window.innerWidth >= 1024);
  const [visualViewportHeight, setVisualViewportHeight] = useState<number | null>(null);

  const { evaluation, analyzePosition, stopSearch } = useStockfish();
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pieceSet } = useBoardSettings();

  useEffect(() => {
    if (!isOpen) return;
    setEditorState(parseFenToEditorState(initialFen));
    setSelectedTool(null);
    setLoadErrorMessage(null);
  }, [initialFen, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updateLayout = () => {
      const viewportWidth = window.innerWidth;
      const vv = window.visualViewport;
      const currentHeight = vv ? vv.height : window.innerHeight;
      const desktop = viewportWidth >= 1024;
      
      setIsDesktopLayout(desktop);
      setVisualViewportHeight(currentHeight);

      if (desktop) {
        const availableHeight = Math.floor(currentHeight * 0.92) - 24;
        const availableWidth = Math.max(320, viewportWidth - 480 - 48);
        setBoardSize(Math.max(320, Math.min(availableHeight, availableWidth)));
      } else {
        const maxBoardWidth = viewportWidth - 48; // Account for 24px outer modal padding and 24px chessboard container padding
        const maxBoardHeight = currentHeight - 280;
        setBoardSize(Math.max(280, Math.min(maxBoardWidth, maxBoardHeight)));
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateLayout);
      vv.addEventListener('scroll', updateLayout);
    }

    return () => {
      window.removeEventListener('resize', updateLayout);
      if (vv) {
        vv.removeEventListener('resize', updateLayout);
        vv.removeEventListener('scroll', updateLayout);
      }
    };
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
    onSwitchSides();
    setSelectedTool(null);
    setLoadErrorMessage(null);
  };

  const isEraserActive = selectedTool === 'erase';

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-[#080B14]/85 px-3 py-3 backdrop-blur-sm">
      <div
        className="mx-auto flex w-full h-[calc(100dvh-1.5rem)] lg:h-[calc(100vh-1.5rem)] max-h-[calc(100dvh-1.5rem)] lg:max-h-[calc(100vh-1.5rem)] max-w-[1460px] items-stretch"
        style={{
          height: !isDesktopLayout && visualViewportHeight ? `${visualViewportHeight - 24}px` : undefined,
          maxHeight: !isDesktopLayout && visualViewportHeight ? `${visualViewportHeight - 24}px` : undefined,
        }}
      >
        <div className={`relative flex h-full w-full overflow-hidden rounded-sm border border-[rgba(212,175,110,0.12)] bg-[#0C1020] shadow-2xl ${isEraserActive ? 'eraser-mode-active' : ''}`}>
          <button
            onClick={() => { soundManager.playButtonClick(); onCancel(); }}
            className="absolute right-4 top-2.5 z-20 rounded-md border border-[rgba(212,175,110,0.12)] bg-[#080B14]/80 p-2 text-[#8E8B82] transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close editor"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col lg:grid min-h-0 flex-1 w-full max-w-full overflow-hidden lg:grid-cols-[auto_minmax(0,1fr)_minmax(340px,420px)] lg:gap-0">
            <div className="flex-shrink-0 flex min-h-0 w-full lg:w-auto items-center lg:items-stretch border-b border-[rgba(212,175,110,0.12)] bg-[#080B14]/35 px-3 py-3 pt-14 lg:pt-3 lg:border-b-0 lg:border-r lg:border-brand-border/80">
              <EvaluationBar evaluation={evaluation} isDesktop={isDesktopLayout} boardHeight={boardSize} />
            </div>

            <div className="flex-shrink-0 flex min-h-0 items-center justify-center border-b border-brand-border px-3 py-3 lg:border-b-0 lg:border-r lg:border-brand-border/80">
              <EditPositionBoard
                position={editorState.position}
                selectedTool={selectedTool}
                boardOrientation={boardOrientation}
                onPositionChange={updatePosition}
                boardSize={boardSize}
              />
            </div>

            <div
              className="min-h-0 overflow-y-auto lg:overflow-hidden flex-1 px-3 py-3 sm:px-4 sm:py-4 lg:pt-14 w-full"
              style={!isDesktopLayout ? { paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' } : undefined}
            >
              <div className="flex h-auto lg:h-full min-h-0 flex-col gap-2">
                <div className="grid grid-cols-1 gap-2 flex-shrink-0">
                  {PIECE_ROWS.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="grid grid-cols-6 gap-1.5 rounded-xl border border-[rgba(212,175,110,0.12)] bg-[#080B14]/50 p-1.5"
                    >
                      {row.map((pieceCode) => {
                        const PieceSvg = pieceSet.pieces[pieceCode];
                        const isSelected = selectedTool === pieceCode;

                        return (
                          <button
                            key={pieceCode}
                            onClick={() => selectTool(pieceCode)}
                            className={`flex aspect-square items-center justify-center rounded-lg border transition-all ${isSelected
                              ? 'border-[#D4AF6E] bg-[#D4AF6E]/15 text-white shadow-[0_0_0_1px_rgba(212,175,110,0.45),0_0_24px_rgba(212,175,110,0.22)] scale-105'
                              : 'border-[rgba(212,175,110,0.12)] bg-[#080B14]/50 text-[#8E8B82] hover:bg-white/5 hover:text-white'
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
                  className={`flex-shrink-0 flex items-center justify-center gap-3 rounded-lg border px-4 py-2.5 transition-all duration-150 ${selectedTool === 'erase'
                    ? 'border-[#D4AF6E] bg-[#D4AF6E]/15 text-white shadow-[0_0_0_1px_rgba(212,175,110,0.45),0_0_24px_rgba(212,175,110,0.22)] scale-[1.02]'
                    : 'border-[rgba(212,175,110,0.12)] bg-[#080B14] text-[#8E8B82] hover:bg-white/5 hover:text-white'
                    }`}
                  role="checkbox"
                  aria-checked={selectedTool === 'erase'}
                  title="Eraser Mode"
                >
                  {/* Custom Checkbox UI */}
                  <div
                    className={`relative flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 ${selectedTool === 'erase'
                      ? 'border-[#D4AF6E] bg-[#D4AF6E] text-[#080B14] scale-100 shadow-[0_0_12px_rgba(212,175,110,0.45)]'
                      : 'border-[#8E8B82]/40 bg-[#080B14] text-transparent'
                      }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-3.5 h-3.5 transition-all duration-200 transform ${selectedTool === 'erase' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                        }`}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  {/* Restored Eraser Icon */}
                  <Eraser className="w-4 h-4" />
                </button>

                <section className="flex flex-col min-h-0 lg:flex-1 lg:overflow-y-auto pr-1.5 lg:pr-1.5 gap-2 scrollbar-thin lg:scrollbar-thin">
                  <div className="rounded-xl border border-[rgba(212,175,110,0.12)] bg-[#080B14]/50 p-2.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['w', 'b'] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setEditorState((current) => ({ ...current, activeColor: color }));
                            setLoadErrorMessage(null);
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${editorState.activeColor === color
                            ? 'border-[#D4AF6E] bg-[#D4AF6E]/15 text-white'
                            : 'border-[rgba(212,175,110,0.12)] bg-[#080B14] text-[#8E8B82] hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          {color === 'w' ? 'White to move' : 'Black to move'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[rgba(212,175,110,0.12)] bg-[#080B14]/50 p-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      {/* White Castling Rights (Left Column) */}
                      <div className="space-y-2 text-left">
                        <div className="text-xs font-semibold text-[#8E8B82] font-sans uppercase tracking-wider">White</div>
                        <div className="flex flex-col gap-2 pl-1">
                          <label className="flex items-center gap-2 text-sm text-white/90 cursor-pointer select-none group">
                            <input
                              type="checkbox"
                              checked={editorState.castlingRights.K}
                              onChange={() => {
                                setEditorState((current) => ({
                                  ...current,
                                  castlingRights: { ...current.castlingRights, K: !current.castlingRights.K }
                                }));
                                setLoadErrorMessage(null);
                              }}
                              className="sr-only"
                            />
                            <div
                              className={`relative flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 ${editorState.castlingRights.K
                                ? 'border-brand-accent bg-brand-accent text-white scale-100 shadow-[0_0_12px_rgba(212,175,110,0.45)]'
                                : 'border-[rgba(212,175,110,0.12)] bg-[#080B14] text-transparent group-hover:border-brand-accent/50'
                                }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`w-3.5 h-3.5 transition-all duration-200 transform ${editorState.castlingRights.K ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                                  }`}
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <span className="font-sans font-medium text-[#8E8B82] group-hover:text-white transition-colors duration-150">
                              (O-O)
                            </span>
                          </label>
                          <label className="flex items-center gap-2 text-sm text-white/90 cursor-pointer select-none group">
                            <input
                              type="checkbox"
                              checked={editorState.castlingRights.Q}
                              onChange={() => {
                                setEditorState((current) => ({
                                  ...current,
                                  castlingRights: { ...current.castlingRights, Q: !current.castlingRights.Q }
                                }));
                                setLoadErrorMessage(null);
                              }}
                              className="sr-only"
                            />
                            <div
                              className={`relative flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 ${editorState.castlingRights.Q
                                ? 'border-brand-accent bg-brand-accent text-white scale-100 shadow-[0_0_12px_rgba(212,175,110,0.45)]'
                                : 'border-[rgba(212,175,110,0.12)] bg-[#080B14] text-transparent group-hover:border-brand-accent/50'
                                }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`w-3.5 h-3.5 transition-all duration-200 transform ${editorState.castlingRights.Q ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                                  }`}
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <span className="font-sans font-medium text-[#8E8B82] group-hover:text-white transition-colors duration-150">
                              (O-O-O)
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Black Castling Rights (Right Column) */}
                      <div className="space-y-2 text-left">
                        <div className="text-xs font-semibold text-[#8E8B82] font-sans uppercase tracking-wider">Black</div>
                        <div className="flex flex-col gap-2 pl-1">
                          <label className="flex items-center gap-2 text-sm text-white/90 cursor-pointer select-none group">
                            <input
                              type="checkbox"
                              checked={editorState.castlingRights.k}
                              onChange={() => {
                                setEditorState((current) => ({
                                  ...current,
                                  castlingRights: { ...current.castlingRights, k: !current.castlingRights.k }
                                }));
                                setLoadErrorMessage(null);
                              }}
                              className="sr-only"
                            />
                            <div
                              className={`relative flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 ${editorState.castlingRights.k
                                ? 'border-brand-accent bg-brand-accent text-white scale-100 shadow-[0_0_12px_rgba(212,175,110,0.45)]'
                                : 'border-[rgba(212,175,110,0.12)] bg-[#080B14] text-transparent group-hover:border-brand-accent/50'
                                }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`w-3.5 h-3.5 transition-all duration-200 transform ${editorState.castlingRights.k ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                                  }`}
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <span className="font-sans font-medium text-[#8E8B82] group-hover:text-white transition-colors duration-150">
                              (O-O)
                            </span>
                          </label>
                          <label className="flex items-center gap-2 text-sm text-white/90 cursor-pointer select-none group">
                            <input
                              type="checkbox"
                              checked={editorState.castlingRights.q}
                              onChange={() => {
                                setEditorState((current) => ({
                                  ...current,
                                  castlingRights: { ...current.castlingRights, q: !current.castlingRights.q }
                                }));
                                setLoadErrorMessage(null);
                              }}
                              className="sr-only"
                            />
                            <div
                              className={`relative flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 ${editorState.castlingRights.q
                                ? 'border-brand-accent bg-brand-accent text-white scale-100 shadow-[0_0_12px_rgba(212,175,110,0.45)]'
                                : 'border-[rgba(212,175,110,0.12)] bg-[#080B14] text-transparent group-hover:border-brand-accent/50'
                                }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`w-3.5 h-3.5 transition-all duration-200 transform ${editorState.castlingRights.q ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                                  }`}
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <span className="font-sans font-medium text-[#8E8B82] group-hover:text-white transition-colors duration-150">
                              (O-O-O)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* This was breaking the previewFen */}
                  {/* <div className="overflow-hidden rounded-xl border border-[rgba(212,175,110,0.12)] bg-[#080B14]/50 px-2.5 h-8 flex items-center">
                    <div className="w-full overflow-x-auto overflow-y-hidden no-scrollbar flex items-center">
                      <div className="font-mono text-[11px] leading-normal text-white whitespace-nowrap select-all">
                        {previewFen}
                      </div>
                    </div>
                  </div> */}
                  {/* This Fixes It */}
                  <div className="rounded-xl border border-[rgba(212,175,110,0.12)] bg-[#080B14]/50 px-2"><input type="text" readOnly value={previewFen} onFocus={(e) => e.target.select()} className="w-full bg-transparent border-0 outline-none font-mono text-[11px] leading-5 text-white px-0 py-1" /></div>

                  <div className="rounded-xl border border-[rgba(212,175,110,0.12)] bg-[#080B14]/50 p-2.5 space-y-2">
                    <button
                      onClick={() => { soundManager.playButtonClick(); handleLoadPreset(createEmptyEditorState()); }}
                      className="w-full rounded-lg border border-[rgba(212,175,110,0.12)] bg-[#080B14] px-3 py-2 text-sm font-medium text-[#8E8B82] transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Trash2 className="mr-2 inline-block h-4 w-4 align-[-2px]" />
                      Clear
                    </button>

                    <button
                      onClick={() => { soundManager.playButtonClick(); handleLoadPreset(createStandardEditorState()); }}
                      className="w-full rounded-lg border border-[rgba(212,175,110,0.12)] bg-[#080B14] px-3 py-2 text-sm font-medium text-[#8E8B82] transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Home className="mr-2 inline-block h-4 w-4 align-[-2px]" />
                      Starting Position
                    </button>

                    <button
                      onClick={() => { soundManager.playButtonClick(); handleLoadPreset(createChess960EditorState()); }}
                      className="w-full rounded-lg border border-[rgba(212,175,110,0.12)] bg-[#080B14] px-3 py-2 text-sm font-medium text-[#8E8B82] transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Shuffle className="mr-2 inline-block h-4 w-4 align-[-2px]" />
                      Shuffle
                    </button>

                    <button
                      onClick={() => { soundManager.playButtonClick(); handleSwitchSides(); }}
                      className="w-full rounded-lg border border-[rgba(212,175,110,0.12)] bg-[#080B14] px-3 py-2 text-sm font-medium text-[#8E8B82] transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <ArrowLeftRight className="mr-2 inline-block h-4 w-4 align-[-2px]" />
                      Switch Sides
                    </button>
                  </div>

                  <div className="flex items-end justify-end pt-0.5 mt-auto">
                    <button
                      onClick={() => { soundManager.playButtonClick(); handleLoad(); }}
                      className="w-full rounded-lg btn-premium-cta cta-shine py-2 text-sm font-medium"
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

          <div className="relative w-full max-w-md rounded-2xl border border-red-500/40 bg-[#0C1020]/95 p-5 text-red-100 shadow-[0_0_40px_rgba(239,68,68,0.22)] backdrop-blur-md animate-fade-in">
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

