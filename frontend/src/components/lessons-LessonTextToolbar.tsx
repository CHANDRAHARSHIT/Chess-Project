import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  ZoomIn,
  ZoomOut,
  Grid,
  Sparkles,
} from "lucide-react";
import { FontSizeControl } from "@/components/lessons-FontSizeControl";
import { AlignmentDropdown } from "@/components/lessons-AlignmentDropdown";
import { LinkPopover } from "@/components/lessons-LinkPopover";

export interface LessonTextToolbarProps {
  formatDocument: (command: string, value?: string) => void;
  applyFontSize: (size: number) => void;
  toggleCoachCallout: () => void;
  isCalloutActive: boolean;
  hasTextSelection: boolean;
  linkPopoverOpen: boolean;
  setLinkPopoverOpen: (open: boolean) => void;
  existingLinkUrl: string;
  applyLinkToSelection: (url: string) => void;
  removeLinkFromSelection: () => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  hasBoard: boolean;
  toggleChessboard: () => void;
  saveCurrentSelection: () => void;
}

export function LessonTextToolbar({
  formatDocument,
  applyFontSize,
  toggleCoachCallout,
  isCalloutActive,
  hasTextSelection,
  linkPopoverOpen,
  setLinkPopoverOpen,
  existingLinkUrl,
  applyLinkToSelection,
  removeLinkFromSelection,
  zoomLevel,
  setZoomLevel,
  hasBoard,
  toggleChessboard,
  saveCurrentSelection,
}: LessonTextToolbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-brand-surface/40 border-t border-brand-border/30 select-none relative z-30 overflow-visible">
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* History */}
        <button
          type="button"
          title="Undo"
          onClick={() => formatDocument("undo")}
          className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
        >
          <Undo className="w-[18px] h-[18px]" />
        </button>
        <button
          type="button"
          title="Redo"
          onClick={() => formatDocument("redo")}
          className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
        >
          <Redo className="w-[18px] h-[18px]" />
        </button>

        <div className="w-px h-5 bg-brand-border mx-1" />

        {/* Numeric Font Size Control */}
        <FontSizeControl onApplyFontSize={(size) => applyFontSize(size)} />

        <div className="w-px h-5 bg-brand-border mx-1" />

        {/* Inline Formatting */}
        <button
          type="button"
          title="Bold"
          onClick={() => formatDocument("bold")}
          className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer font-bold"
        >
          <Bold className="w-[18px] h-[18px]" />
        </button>
        <button
          type="button"
          title="Italic"
          onClick={() => formatDocument("italic")}
          className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer italic"
        >
          <Italic className="w-[18px] h-[18px]" />
        </button>
        <button
          type="button"
          title="Underline"
          onClick={() => formatDocument("underline")}
          className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer underline"
        >
          <Underline className="w-[18px] h-[18px]" />
        </button>

        <div className="w-px h-5 bg-brand-border mx-1" />

        {/* Lists */}
        <button
          type="button"
          title="Bulleted List"
          onClick={() => formatDocument("insertUnorderedList")}
          className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
        >
          <List className="w-[18px] h-[18px]" />
        </button>
        <button
          type="button"
          title="Numbered List"
          onClick={() => formatDocument("insertOrderedList")}
          className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
        >
          <ListOrdered className="w-[18px] h-[18px]" />
        </button>

        {/* Alignment Menu */}
        <AlignmentDropdown onSelectAlign={(cmd) => formatDocument(cmd)} />

        <div className="w-px h-5 bg-brand-border mx-1" />

        {/* Callouts, Dividers & Links */}
        <button
          type="button"
          title="Coach Note / Callout"
          onClick={toggleCoachCallout}
          className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
            isCalloutActive
              ? "text-brand-accent bg-brand-accent/15 border border-brand-accent/30 shadow-[0_0_8px_rgba(212,175,110,0.15)]"
              : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/5"
          }`}
        >
          <Quote className="w-[18px] h-[18px]" />
        </button>
        <button
          type="button"
          title="Horizontal Divider"
          onClick={() => formatDocument("insertHorizontalRule")}
          className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
        >
          <Minus className="w-[18px] h-[18px]" />
        </button>

        {/* Inline Link Toolbar Control */}
        <div className="relative inline-block z-40">
          <button
            type="button"
            title={hasTextSelection ? "Insert / Edit Link" : "Select text to insert link"}
            onMouseDown={(e) => {
              if (hasTextSelection) {
                e.preventDefault();
                saveCurrentSelection();
              }
            }}
            onClick={() => {
              if (hasTextSelection) {
                setLinkPopoverOpen(!linkPopoverOpen);
              }
            }}
            disabled={!hasTextSelection}
            className={`p-1.5 rounded-md transition-colors ${
              hasTextSelection
                ? "text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 cursor-pointer"
                : "text-brand-secondary/30 cursor-not-allowed"
            }`}
          >
            <LinkIcon className="w-[18px] h-[18px]" />
          </button>

          {linkPopoverOpen && (
            <LinkPopover
              initialUrl={existingLinkUrl}
              onApply={applyLinkToSelection}
              onRemove={existingLinkUrl ? removeLinkFromSelection : undefined}
              onClose={() => setLinkPopoverOpen(false)}
            />
          )}
        </div>

        <div className="w-px h-5 bg-brand-border mx-1" />

        {/* Zoom Controls */}
        <button
          type="button"
          title="Zoom Out"
          onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
          className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-[18px] h-[18px]" />
        </button>
        <span className="text-xs font-mono text-brand-secondary min-w-[40px] text-center">
          {zoomLevel}%
        </span>
        <button
          type="button"
          title="Zoom In"
          onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
          className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-[18px] h-[18px]" />
        </button>

        <div className="w-px h-5 bg-brand-border mx-1" />

        {/* Chessboard Toggle */}
        <button
          type="button"
          title={hasBoard ? "Remove Board" : "Insert Interactive Chessboard"}
          onClick={toggleChessboard}
          className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
            hasBoard
              ? "text-brand-accent bg-brand-accent/15 border border-brand-accent/30 shadow-[0_0_8px_rgba(212,175,110,0.15)]"
              : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/5"
          }`}
        >
          <Grid className="w-[18px] h-[18px]" />
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-brand-secondary">
        <Sparkles className="w-3.5 h-3.5 text-brand-accent/70" />
        <span className="font-sans">XLChess Lesson Builder</span>
      </div>
    </div>
  );
}
