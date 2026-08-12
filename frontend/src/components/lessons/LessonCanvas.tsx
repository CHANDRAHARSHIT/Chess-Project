import { RichTextEditor } from "./RichTextEditor";
import { EmbeddedChessboard } from "./EmbeddedChessboard";

interface LessonCanvasProps {
  content: string;
  onContentChange: (content: string) => void;
  hasBoard: boolean;
  fen?: string;
  onFenChange?: (fen: string) => void;
  onRemoveBoard?: () => void;
  zoomLevel?: number;
  onContextMenu?: (x: number, y: number) => void;
}

export function LessonCanvas({
  content,
  onContentChange,
  hasBoard,
  fen,
  onFenChange,
  onRemoveBoard,
  zoomLevel = 100,
  onContextMenu,
}: LessonCanvasProps) {
  return (
    <div
      style={{ transform: `scale(${zoomLevel / 100})` }}
      className="w-full max-w-7xl min-h-[680px] h-auto bg-brand-surface rounded-xl border border-[rgba(212,175,110,0.18)] shadow-2xl transition-transform duration-150 relative p-10 md:p-12 font-sans text-brand-text origin-top"
    >
      {/* Document Flow Container */}
      <div className="w-full h-full relative">
        {/* Fixed Right-Aligned Embedded Chessboard */}
        {hasBoard && (
          <EmbeddedChessboard
            fen={fen}
            onFenChange={onFenChange}
            onRemove={onRemoveBoard}
          />
        )}

        {/* Document Text Editor */}
        <RichTextEditor content={content} onChange={onContentChange} onContextMenu={onContextMenu} />
      </div>
    </div>
  );
}
