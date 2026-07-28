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
}

export function LessonCanvas({
  content,
  onContentChange,
  hasBoard,
  fen,
  onFenChange,
  onRemoveBoard,
  zoomLevel = 100,
}: LessonCanvasProps) {
  return (
    <div
      style={{ transform: `scale(${zoomLevel / 100})` }}
      className="w-full max-w-5xl min-h-[540px] h-auto bg-brand-surface rounded-xl border border-[rgba(212,175,110,0.18)] shadow-2xl transition-transform duration-150 relative p-8 font-sans text-brand-text origin-top"
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
        <RichTextEditor content={content} onChange={onContentChange} />
      </div>
    </div>
  );
}
