import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Plus,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  FolderPlus,
  Layers,
  Sparkles,
  Grid,
  Bold,
  Italic,
  Underline,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  WifiOff,
  CloudUpload,
  HardDrive,
  ChevronDown,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Minus,
  Link as LinkIcon,
  X,
  Scissors,
  Copy,
  Clipboard,
  CheckSquare,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { LessonCanvas } from "../components/lessons/LessonCanvas";
import { LessonBuilderSidebar } from "../components/lessons/LessonBuilderSidebar";
import {
  builderLessonService,
  type BuilderLessonData,
} from "../services/builderLesson.service";
import { lessonCacheService } from "../services/lessonCache.service";
import { lessonSyncService, type SyncState } from "../services/lessonSync.service";
import { AuthModal } from "../components/AuthModal";

interface SlideData {
  id: string;
  title: string;
  content: string;
  hasBoard: boolean;
  fen?: string;
  annotations?: any;
}

interface SegmentData {
  id: string;
  title: string;
  isExpanded: boolean;
  slides: SlideData[];
}

interface PublishModalProps {
  currentStatus: "DRAFT" | "PUBLISHED";
  isPublishing: boolean;
  isSavingDraft: boolean;
  onConfirmPublish: () => void;
  onSaveAsDraft: () => void;
  onClose: () => void;
}

function PublishConfirmationModal({
  currentStatus,
  isPublishing,
  isSavingDraft,
  onConfirmPublish,
  onSaveAsDraft,
  onClose,
}: PublishModalProps) {
  const isRepublish = currentStatus === "PUBLISHED";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-6 font-sans text-brand-text space-y-5 animate-in zoom-in-95 duration-150 relative"
      >
        {/* Subtle Top-Right X Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPublishing || isSavingDraft}
          title="Close"
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-secondary hover:text-brand-text hover:bg-brand-text/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center text-brand-accent shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-brand-text">
              {isRepublish ? "Republish Lesson?" : "Publish Lesson?"}
            </h3>
            <p className="text-xs text-brand-secondary mt-0.5">
              {isRepublish
                ? "Update published content for learners."
                : "Make your lesson available to students."}
            </p>
          </div>
        </div>

        <p className="text-sm text-brand-secondary leading-relaxed">
          {isRepublish
            ? "Are you sure you want to republish this lesson? All recent updates to slides, text, and positions will be saved to your published lesson."
            : "Are you sure you want to publish this lesson? It will be marked as published in your library."}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-brand-border/40">
          {/* Save as draft Button */}
          <button
            type="button"
            onClick={onSaveAsDraft}
            disabled={isPublishing || isSavingDraft}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-border/60 hover:bg-brand-text/5 text-brand-secondary hover:text-brand-text text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving draft...</span>
              </>
            ) : (
              <span>Save as draft</span>
            )}
          </button>

          {/* Publish Lesson Button */}
          <button
            type="button"
            onClick={onConfirmPublish}
            disabled={isPublishing || isSavingDraft}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-brand-bg hover:bg-brand-accent-hover text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                <span>{isRepublish ? "Republish Lesson" : "Publish Lesson"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface LinkPopoverProps {
  initialUrl?: string;
  onApply: (url: string) => void;
  onRemove?: () => void;
  onClose: () => void;
}

function LinkPopover({ initialUrl = "https://", onApply, onRemove, onClose }: LinkPopoverProps) {
  const [url, setUrl] = useState<string>(initialUrl || "https://");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onApply(url.trim());
    }
  };

  return (
    <div
      ref={popoverRef}
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute left-0 top-full mt-2 w-80 p-3 rounded-xl bg-brand-surface border border-brand-border shadow-2xl z-50 font-sans text-xs flex flex-col gap-2.5 select-none"
    >
      <div className="flex items-center justify-between border-b border-brand-border/40 pb-1.5 text-brand-secondary font-medium">
        <div className="flex items-center gap-1.5 text-brand-accent font-semibold">
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Insert Hyperlink</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-brand-text/10 text-brand-secondary hover:text-brand-text cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          autoFocus
          className="flex-1 px-2.5 py-1.5 rounded-md bg-brand-bg text-brand-text border border-brand-border/60 outline-none focus:border-brand-accent text-xs font-mono"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-md bg-brand-accent text-brand-bg hover:bg-brand-accent-hover font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          <span>OK</span>
        </button>
      </form>

      {onRemove && (
        <div className="flex justify-end pt-1 border-t border-brand-border/30">
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] text-red-400 hover:underline cursor-pointer font-medium"
          >
            Remove Link
          </button>
        </div>
      )}
    </div>
  );
}

interface ContextMenuProps {
  x: number;
  y: number;
  hasSelection: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onLink: () => void;
  onSelectAll: () => void;
  onClose: () => void;
}

function ContextMenu({
  x,
  y,
  hasSelection,
  onCut,
  onCopy,
  onPaste,
  onLink,
  onSelectAll,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_WIDTH = 160;
  const MENU_HEIGHT = 190;
  const adjustedX = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const adjustedY = Math.min(y, window.innerHeight - MENU_HEIGHT - 8);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed z-[100] w-40 py-1.5 px-1 rounded-xl bg-brand-surface border border-brand-border shadow-2xl font-sans text-xs text-brand-text select-none flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Cut */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={hasSelection ? onCut : undefined}
        disabled={!hasSelection}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
          hasSelection
            ? "text-brand-text hover:bg-brand-accent/15 hover:text-brand-accent cursor-pointer font-medium"
            : "text-brand-secondary/40 cursor-not-allowed"
        }`}
      >
        <div className="flex items-center gap-2">
          <Scissors className="w-3.5 h-3.5" />
          <span>Cut</span>
        </div>
        <span className="text-[10px] font-mono opacity-50">Ctrl+X</span>
      </button>

      {/* Copy */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={hasSelection ? onCopy : undefined}
        disabled={!hasSelection}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
          hasSelection
            ? "text-brand-text hover:bg-brand-accent/15 hover:text-brand-accent cursor-pointer font-medium"
            : "text-brand-secondary/40 cursor-not-allowed"
        }`}
      >
        <div className="flex items-center gap-2">
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </div>
        <span className="text-[10px] font-mono opacity-50">Ctrl+C</span>
      </button>

      {/* Paste */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onPaste}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-brand-text hover:bg-brand-accent/15 hover:text-brand-accent transition-colors cursor-pointer font-medium"
      >
        <div className="flex items-center gap-2">
          <Clipboard className="w-3.5 h-3.5" />
          <span>Paste</span>
        </div>
        <span className="text-[10px] font-mono opacity-50">Ctrl+V</span>
      </button>

      <div className="my-1 border-t border-brand-border/40" />

      {/* Link */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={hasSelection ? onLink : undefined}
        disabled={!hasSelection}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
          hasSelection
            ? "text-brand-text hover:bg-brand-accent/15 hover:text-brand-accent cursor-pointer font-medium"
            : "text-brand-secondary/40 cursor-not-allowed"
        }`}
      >
        <div className="flex items-center gap-2">
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Link</span>
        </div>
        <span className="text-[10px] font-mono opacity-50">Ctrl+K</span>
      </button>

      <div className="my-1 border-t border-brand-border/40" />

      {/* Select All */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSelectAll}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-brand-text hover:bg-brand-accent/15 hover:text-brand-accent transition-colors cursor-pointer font-medium"
      >
        <div className="flex items-center gap-2">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Select All</span>
        </div>
        <span className="text-[10px] font-mono opacity-50">Ctrl+A</span>
      </button>
    </div>
  );
}

const PREDEFINED_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;

function FontSizeControl({ onApplyFontSize }: { onApplyFontSize: (size: number) => void }) {
  const [currentSize, setCurrentSize] = useState<number>(16);
  const [inputValue, setInputValue] = useState<string>("16");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const saveCurrentSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const activeEditor = document.querySelector('[contenteditable="true"]');
      if (activeEditor && activeEditor.contains(sel.anchorNode)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (savedRangeRef.current && typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const detectFontSize = () => {
    if (typeof window === "undefined") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const activeEditor = document.querySelector('[contenteditable="true"]');
    if (!activeEditor || !activeEditor.contains(selection.anchorNode)) return;

    saveCurrentSelection();

    let node: Node | null = selection.anchorNode;
    if (node && node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    if (node && node instanceof HTMLElement) {
      const inlineSize = node.style.fontSize;
      if (inlineSize) {
        const parsedInline = parseInt(inlineSize, 10);
        if (!isNaN(parsedInline) && parsedInline >= MIN_FONT_SIZE && parsedInline <= MAX_FONT_SIZE) {
          setCurrentSize(parsedInline);
          setInputValue(String(parsedInline));
          return;
        }
      }

      const computedSize = window.getComputedStyle(node).fontSize;
      if (computedSize) {
        const parsed = Math.round(parseFloat(computedSize));
        if (!isNaN(parsed) && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) {
          setCurrentSize(parsed);
          setInputValue(String(parsed));
        }
      }
    }
  };

  useEffect(() => {
    document.addEventListener("selectionchange", detectFontSize);
    return () => document.removeEventListener("selectionchange", detectFontSize);
  }, []);

  const handleSelectSize = (size: number) => {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size));
    setCurrentSize(clamped);
    setInputValue(String(clamped));
    restoreSelection();
    onApplyFontSize(clamped);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, parsed));
      setCurrentSize(clamped);
      restoreSelection();
      onApplyFontSize(clamped);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const parsed = parseInt(inputValue, 10);
      if (!isNaN(parsed)) {
        handleSelectSize(parsed);
      }
    }
  };

  const incrementSize = (e?: React.MouseEvent) => {
    e?.preventDefault();
    saveCurrentSelection();
    let nextSize: number;
    const nextIdx = PREDEFINED_FONT_SIZES.findIndex((s) => s > currentSize);
    if (nextIdx !== -1) {
      nextSize = PREDEFINED_FONT_SIZES[nextIdx];
    } else {
      nextSize = currentSize + 1;
    }
    const clamped = Math.min(MAX_FONT_SIZE, nextSize);
    handleSelectSize(clamped);
  };

  const decrementSize = (e?: React.MouseEvent) => {
    e?.preventDefault();
    saveCurrentSelection();
    let prevSize: number;
    const prevSizes = PREDEFINED_FONT_SIZES.filter((s) => s < currentSize);
    if (prevSizes.length > 0) {
      prevSize = prevSizes[prevSizes.length - 1];
    } else {
      prevSize = currentSize - 1;
    }
    const clamped = Math.max(MIN_FONT_SIZE, prevSize);
    handleSelectSize(clamped);
  };

  return (
    <div ref={dropdownRef} className="relative flex items-center gap-0.5 text-left z-40">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          saveCurrentSelection();
        }}
        onClick={decrementSize}
        title="Decrease font size"
        className="w-6 h-7 flex items-center justify-center rounded-l-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/10 border border-brand-border/50 bg-brand-surface/60 cursor-pointer font-bold text-xs"
      >
        -
      </button>

      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onMouseDown={() => {
            saveCurrentSelection();
          }}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            saveCurrentSelection();
            setIsOpen(true);
          }}
          title="Font Size (px)"
          aria-label="Font Size"
          className="w-10 h-7 bg-brand-surface/80 text-brand-text font-mono text-xs font-semibold text-center border-y border-brand-border/50 outline-none focus:bg-brand-surface focus:border-brand-accent"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            saveCurrentSelection();
          }}
          onClick={() => setIsOpen(!isOpen)}
          title="Select Font Size"
          aria-label="Select Font Size"
          className="h-7 px-1 flex items-center justify-center bg-brand-surface/80 border-y border-r border-brand-border/50 text-brand-secondary hover:text-brand-text cursor-pointer rounded-r-md"
        >
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
      </div>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          saveCurrentSelection();
        }}
        onClick={incrementSize}
        title="Increase font size"
        className="w-6 h-7 flex items-center justify-center rounded-r-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/10 border border-brand-border/50 bg-brand-surface/60 cursor-pointer font-bold text-xs ml-0.5"
      >
        +
      </button>

      {isOpen && (
        <div className="absolute left-6 top-full mt-1.5 w-24 max-h-56 overflow-y-auto rounded-lg bg-brand-surface border border-brand-border shadow-2xl z-50 py-1 font-mono text-xs select-none">
          {PREDEFINED_FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveCurrentSelection();
              }}
              onClick={() => handleSelectSize(size)}
              className={`w-full text-center py-1 px-2 hover:bg-brand-text/10 transition-colors cursor-pointer flex items-center justify-between ${
                currentSize === size
                  ? "text-brand-accent bg-brand-accent/10 font-bold"
                  : "text-brand-text"
              }`}
            >
              <span>{size}</span>
              {currentSize === size && <Check className="w-3 h-3 text-brand-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AlignmentDropdown({ onSelectAlign }: { onSelectAlign: (cmd: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAlign, setActiveAlign] = useState<"left" | "center" | "right">("left");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { id: "left", label: "Align Left", icon: AlignLeft, cmd: "justifyLeft" },
    { id: "center", label: "Align Center", icon: AlignCenter, cmd: "justifyCenter" },
    { id: "right", label: "Align Right", icon: AlignRight, cmd: "justifyRight" },
  ];

  const CurrentIcon =
    activeAlign === "center"
      ? AlignCenter
      : activeAlign === "right"
      ? AlignRight
      : AlignLeft;

  return (
    <div ref={dropdownRef} className="relative inline-block text-left z-40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Text Alignment"
        className="flex items-center gap-1 p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer border border-brand-border/50 bg-brand-surface/60"
      >
        <CurrentIcon className="w-[18px] h-[18px]" />
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-32 rounded-lg bg-brand-surface border border-brand-border shadow-2xl z-50 py-1 font-sans">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelectAlign(opt.cmd);
                  setActiveAlign(opt.id as any);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  activeAlign === opt.id
                    ? "text-brand-accent bg-brand-accent/10 font-semibold"
                    : "text-brand-text hover:bg-brand-text/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </div>
                {activeAlign === opt.id && <Check className="w-3 h-3 text-brand-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LessonBuilderPage() {
  const { id: lessonId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<BuilderLessonData | null>(null);
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<string>("");
  const [activeSlideId, setActiveSlideId] = useState<string>("");
  const [lessonTitle, setLessonTitle] = useState<string>("Untitled Lesson");
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<SyncState>("saved");
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  const [lessonStatus, setLessonStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef<boolean>(true);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Subscribe to sync service status changes
  useEffect(() => {
    const unsubscribe = lessonSyncService.subscribeStatus((status) => {
      setSaveStatus(status);
    });
    return unsubscribe;
  }, []);

  // Load lesson data (IndexedDB first, then server reconciliation)
  useEffect(() => {
    if (lessonId) {
      loadLessonData(lessonId);
    } else {
      setLoading(false);
    }
  }, [lessonId]);

  const loadLessonData = async (id: string) => {
    setLoading(true);
    try {
      // 1. Try restoring from IndexedDB cache first
      const cached = await lessonCacheService.getLessonLocal(id);
      if (cached) {
        applyLessonDataToState(cached);
      }

      // 2. Fetch server version if online
      if (navigator.onLine) {
        try {
          const serverData = await builderLessonService.getLessonById(id);
          // If local version had no unsynced changes, update state with server version
          if (!cached || !cached._hasUnsyncedChanges) {
            applyLessonDataToState(serverData);
            await lessonCacheService.saveLessonLocal(serverData, false);
          } else {
            // Reconcile pending queue with server
            lessonSyncService.processSyncQueue(id);
          }
        } catch (serverErr: any) {
          if (serverErr?.message === "UNAUTHORIZED") {
            setAuthModalOpen(true);
          }
        }
      }
    } catch (err: any) {
      console.error("Error loading lesson data", err);
    } finally {
      setLoading(false);
      isInitialMount.current = true;
    }
  };

  const applyLessonDataToState = (data: BuilderLessonData) => {
    setLesson(data);
    setLessonTitle(data.title || "Untitled Lesson");
    setLessonStatus(data.status || "DRAFT");
    setPublishedAt(data.publishedAt || null);

    const mappedSegments: SegmentData[] = (data.segments || []).map((seg) => ({
      id: seg.id,
      title: seg.title,
      isExpanded: true,
      slides: (seg.slides || []).map((sl) => ({
        id: sl.id,
        title: sl.title || "Slide",
        content: sl.coachText || "",
        hasBoard: Boolean(sl.fen && sl.fen.trim() !== ""),
        fen: sl.fen || "",
        annotations: sl.annotations || {},
      })),
    }));

    setSegments(mappedSegments);
    if (mappedSegments.length > 0) {
      setActiveSegmentId(mappedSegments[0].id);
      if (mappedSegments[0].slides.length > 0) {
        setActiveSlideId(mappedSegments[0].slides[0].id);
      }
    }
  };

  // Find active slide data
  const activeSegment = segments.find((s) => s.id === activeSegmentId);
  const activeSlide = activeSegment?.slides.find((sl) => sl.id === activeSlideId);

  const flushPendingChanges = async () => {
    if (!lessonId) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const updatedTree: BuilderLessonData = {
      id: lessonId,
      title: lessonTitle,
      authorId: lesson?.authorId || "",
      status: lessonStatus,
      segments: segments.map((seg) => ({
        id: seg.id,
        lessonId,
        title: seg.title,
        order: 1,
        slides: seg.slides.map((sl, idx) => ({
          id: sl.id,
          segmentId: seg.id,
          order: idx + 1,
          title: sl.title,
          coachText: sl.content,
          fen: sl.hasBoard ? sl.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : "",
          annotations: sl.annotations || {},
        })),
      })),
    };

    await lessonCacheService.saveLessonLocal(updatedTree, true);

    if (activeSlide) {
      await lessonCacheService.addPendingSync({
        lessonId,
        itemType: "slide",
        itemId: activeSlide.id,
        action: "UPDATE",
        payload: {
          title: activeSlide.title,
          coachText: activeSlide.content,
          fen: activeSlide.hasBoard ? activeSlide.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : "",
          annotations: activeSlide.annotations || {},
        },
      });
    }

    if (navigator.onLine) {
      await lessonSyncService.processSyncQueue(lessonId);
    }
  };

  const handlePublishLesson = async () => {
    if (!lessonId) return;
    setIsPublishing(true);
    try {
      // 1. Flush any pending local / editor changes to database
      await flushPendingChanges();

      // 2. Call backend endpoint to set status to PUBLISHED
      const updated = await builderLessonService.updateLesson(lessonId, { status: "PUBLISHED" });

      // 3. Update local state and IndexedDB cache
      const newStatus = updated.status || "PUBLISHED";
      const newPubAt = updated.publishedAt || new Date().toISOString();
      setLessonStatus(newStatus);
      setPublishedAt(newPubAt);

      if (lesson) {
        setLesson({ ...lesson, status: newStatus, publishedAt: newPubAt });
      }

      await lessonCacheService.saveLessonLocal(
        {
          ...(lesson || {}),
          id: lessonId,
          title: lessonTitle,
          authorId: lesson?.authorId || "",
          status: newStatus,
          publishedAt: newPubAt,
          segments: segments.map((seg) => ({
            id: seg.id,
            lessonId,
            title: seg.title,
            order: 1,
            slides: seg.slides.map((sl, idx) => ({
              id: sl.id,
              segmentId: seg.id,
              order: idx + 1,
              title: sl.title,
              coachText: sl.content,
              fen: sl.hasBoard ? sl.fen || "" : "",
              annotations: sl.annotations || {},
            })),
          })),
        },
        false
      );

      // 4. Show success toast feedback
      showToast(
        lessonStatus === "PUBLISHED"
          ? "Lesson republished successfully!"
          : "Lesson published successfully!",
        "success"
      );
      setPublishModalOpen(false);
    } catch (err: any) {
      console.error("Failed to publish lesson", err);
      showToast(err?.message || "Failed to publish lesson. Please try again.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  const handleSaveAsDraftAndExit = async () => {
    if (!lessonId) return;
    setIsSavingDraft(true);
    try {
      // 1. Flush any pending local / editor changes
      await flushPendingChanges();

      // 2. Process sync queue to database if online
      if (navigator.onLine) {
        await lessonSyncService.processSyncQueue(lessonId);
      }

      setPublishModalOpen(false);
      // 3. Navigate back to Lesson Builder dashboard
      navigate("/lessons");
    } catch (err: any) {
      console.error("Failed to save draft", err);
      showToast(err?.message || "Failed to save draft. Please try again.", "error");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Debounced Local Save (IndexedDB) & Background Sync Queueing
  const triggerAutoSave = (dirtySlideId?: string, dirtySegmentId?: string) => {
    if (!lessonId || isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    lessonSyncService.setSyncState("saving_local");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        // Construct updated lesson tree
        const updatedTree: BuilderLessonData = {
          id: lessonId,
          title: lessonTitle,
          authorId: lesson?.authorId || "",
          status: lessonStatus,
          segments: segments.map((seg) => ({
            id: seg.id,
            lessonId,
            title: seg.title,
            order: 1,
            slides: seg.slides.map((sl, idx) => ({
              id: sl.id,
              segmentId: seg.id,
              order: idx + 1,
              title: sl.title,
              coachText: sl.content,
              fen: sl.hasBoard ? sl.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : "",
              annotations: sl.annotations || {},
            })),
          })),
        };

        // 1. Instant local persistence to IndexedDB
        await lessonCacheService.saveLessonLocal(updatedTree, true);

        // 2. Queue dirty mutation for incremental server sync
        const targetSlide = dirtySlideId ? activeSlide : undefined;
        if (targetSlide) {
          await lessonCacheService.addPendingSync({
            lessonId,
            itemType: "slide",
            itemId: targetSlide.id,
            action: "UPDATE",
            payload: {
              title: targetSlide.title,
              coachText: targetSlide.content,
              fen: targetSlide.hasBoard ? targetSlide.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : "",
              annotations: targetSlide.annotations || {},
            },
          });
        } else if (dirtySegmentId) {
          const targetSeg = segments.find((s) => s.id === dirtySegmentId);
          if (targetSeg) {
            await lessonCacheService.addPendingSync({
              lessonId,
              itemType: "segment",
              itemId: dirtySegmentId,
              action: "UPDATE",
              payload: { title: targetSeg.title },
            });
          }
        } else {
          // General lesson title update
          await lessonCacheService.addPendingSync({
            lessonId,
            itemType: "lesson",
            itemId: lessonId,
            action: "UPDATE",
            payload: { title: lessonTitle },
          });
        }

        lessonSyncService.setSyncState(navigator.onLine ? "saved" : "offline");
      } catch (error) {
        console.error("Local save error", error);
        lessonSyncService.setSyncState("error");
      }
    }, 3000);
  };

  // Select Slide Handler (Triggers Sync Queue)
  const handleSelectSlide = (slideId: string, segId: string) => {
    if (activeSlideId !== slideId) {
      setActiveSlideId(slideId);
      setActiveSegmentId(segId);
      if (lessonId && navigator.onLine) {
        lessonSyncService.processSyncQueue(lessonId);
      }
    }
  };

  // Helper to update active slide properties
  const updateActiveSlide = (updates: Partial<SlideData>) => {
    setSegments(
      segments.map((seg) => {
        if (seg.id === activeSegmentId) {
          return {
            ...seg,
            slides: seg.slides.map((sl) =>
              sl.id === activeSlideId ? { ...sl, ...updates } : sl
            ),
          };
        }
        return seg;
      })
    );

    triggerAutoSave(activeSlideId);
  };

  const handleTitleChange = (newTitle: string) => {
    setLessonTitle(newTitle);
    triggerAutoSave();
  };

  // Exec formatting command on document editor
  const formatDocument = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    triggerAutoSave(activeSlideId);
  };

  const globalSavedRangeRef = useRef<Range | null>(null);
  const [hasTextSelection, setHasTextSelection] = useState<boolean>(false);
  const [existingLinkUrl, setExistingLinkUrl] = useState<string>("");
  const [linkPopoverOpen, setLinkPopoverOpen] = useState<boolean>(false);

  const saveCurrentSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const activeEditor = document.querySelector('[contenteditable="true"]');
      if (activeEditor && activeEditor.contains(sel.anchorNode)) {
        if (!sel.isCollapsed) {
          globalSavedRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
      }
    }
  };

  const restoreSelection = () => {
    if (globalSavedRangeRef.current && typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(globalSavedRangeRef.current);
      }
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      if (typeof window === "undefined") return;
      const sel = window.getSelection();
      const activeEditor = document.querySelector('[contenteditable="true"]');

      if (sel && !sel.isCollapsed && activeEditor && activeEditor.contains(sel.anchorNode)) {
        setHasTextSelection(true);
        saveCurrentSelection();

        let node: Node | null = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        if (node && node instanceof HTMLElement) {
          const anchor = node.closest("a");
          if (anchor && anchor.getAttribute("href")) {
            setExistingLinkUrl(anchor.getAttribute("href") || "");
          } else {
            setExistingLinkUrl("");
          }
        }
      } else {
        setHasTextSelection(false);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const applyFontSize = (size: number) => {
    const activeEditor = document.querySelector('[contenteditable="true"]');
    if (!activeEditor) return;

    restoreSelection();

    const currentSel = window.getSelection();
    if (!currentSel || currentSel.rangeCount === 0 || !activeEditor.contains(currentSel.anchorNode)) {
      (activeEditor as HTMLElement).focus();
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      // Caret mode: insert span for subsequent typing
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      span.appendChild(document.createTextNode("\u200B")); // Zero-width space
      range.insertNode(span);

      const newRange = document.createRange();
      newRange.setStart(span.firstChild!, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      globalSavedRangeRef.current = newRange.cloneRange();
    } else {
      // Selection mode: use font[size="7"] landmark tag and re-select new span elements!
      document.execCommand("fontSize", false, "7");

      const fontEls = activeEditor.querySelectorAll('font[size="7"]');
      let firstSpan: HTMLElement | null = null;
      let lastSpan: HTMLElement | null = null;

      fontEls.forEach((fontEl) => {
        const span = document.createElement("span");
        span.style.fontSize = `${size}px`;
        while (fontEl.firstChild) {
          span.appendChild(fontEl.firstChild);
        }
        fontEl.parentNode?.replaceChild(span, fontEl);
        if (!firstSpan) firstSpan = span;
        lastSpan = span;
      });

      if (firstSpan && lastSpan) {
        const newRange = document.createRange();
        newRange.setStartBefore(firstSpan);
        newRange.setEndAfter(lastSpan);
        sel.removeAllRanges();
        sel.addRange(newRange);
        globalSavedRangeRef.current = newRange.cloneRange();
      }
    }

    activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
    triggerAutoSave(activeSlideId);
  };

  const applyLinkToSelection = (url: string) => {
    restoreSelection();

    const activeEditor = document.querySelector('[contenteditable="true"]');
    if (!activeEditor) return;

    const formattedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

    document.execCommand("createLink", false, formattedUrl);

    const links = activeEditor.querySelectorAll(`a[href="${formattedUrl}"]`);
    links.forEach((a) => {
      (a as HTMLElement).setAttribute("target", "_blank");
      (a as HTMLElement).setAttribute("rel", "noopener noreferrer");
      (a as HTMLElement).className = "text-brand-accent underline underline-offset-2 hover:text-brand-accent-hover cursor-pointer font-medium";
    });

    activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
    triggerAutoSave(activeSlideId);
    setLinkPopoverOpen(false);
  };

  const removeLinkFromSelection = () => {
    restoreSelection();
    document.execCommand("unlink", false);
    const activeEditor = document.querySelector('[contenteditable="true"]');
    if (activeEditor) {
      activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
    }
    triggerAutoSave(activeSlideId);
    setLinkPopoverOpen(false);
  };

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleCut = async () => {
    restoreSelection();
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const text = sel.toString();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        document.execCommand("copy");
      }
      document.execCommand("delete");
      const activeEditor = document.querySelector('[contenteditable="true"]');
      if (activeEditor) {
        activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
      }
      triggerAutoSave(activeSlideId);
    }
    setContextMenuPos(null);
  };

  const handleCopy = async () => {
    restoreSelection();
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const text = sel.toString();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        document.execCommand("copy");
      }
    }
    setContextMenuPos(null);
  };

  const handlePaste = async () => {
    restoreSelection();
    const activeEditor = document.querySelector('[contenteditable="true"]');
    if (activeEditor) {
      (activeEditor as HTMLElement).focus();
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          document.execCommand("insertText", false, text);
        } else {
          document.execCommand("paste");
        }
      } catch {
        document.execCommand("paste");
      }
      activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
      triggerAutoSave(activeSlideId);
    }
    setContextMenuPos(null);
  };

  const handleContextMenuLink = () => {
    restoreSelection();
    setContextMenuPos(null);
    if (hasTextSelection) {
      setLinkPopoverOpen(true);
    }
  };

  const handleSelectAll = () => {
    const activeEditor = document.querySelector('[contenteditable="true"]');
    if (activeEditor) {
      (activeEditor as HTMLElement).focus();
      document.execCommand("selectAll");
      saveCurrentSelection();
    }
    setContextMenuPos(null);
  };

  // Segment Operations
  const addSegment = async () => {
    if (!lessonId) return;
    try {
      const newSeg = await builderLessonService.createSegment(lessonId, `Segment ${segments.length + 1}`);
      const newSlide = newSeg.slides[0];

      const mappedSeg: SegmentData = {
        id: newSeg.id,
        title: newSeg.title,
        isExpanded: true,
        slides: [
          {
            id: newSlide.id,
            title: newSlide.title || "Slide 1",
            content: newSlide.coachText || "",
            hasBoard: false,
            fen: "",
            annotations: newSlide.annotations,
          },
        ],
      };

      const updatedSegments = [...segments, mappedSeg];
      setSegments(updatedSegments);
      setActiveSegmentId(mappedSeg.id);
      setActiveSlideId(newSlide.id);

      // Save to IndexedDB
      await lessonCacheService.saveLessonLocal({
        id: lessonId,
        title: lessonTitle,
        authorId: lesson?.authorId || "",
        status: lesson?.status || "DRAFT",
        segments: updatedSegments.map((s) => ({
          id: s.id,
          lessonId,
          title: s.title,
          order: 1,
          slides: s.slides.map((sl, idx) => ({
            id: sl.id,
            segmentId: s.id,
            order: idx + 1,
            coachText: sl.content,
            fen: sl.fen || "",
          })),
        })),
      });

      lessonSyncService.setSyncState(navigator.onLine ? "saved" : "offline");
    } catch (error) {
      console.error("Failed to add segment", error);
    }
  };

  const toggleSegment = (segId: string) => {
    setSegments(
      segments.map((seg) =>
        seg.id === segId ? { ...seg, isExpanded: !seg.isExpanded } : seg
      )
    );
  };

  const updateSegmentTitle = async (segId: string, title: string) => {
    setSegments(
      segments.map((seg) => (seg.id === segId ? { ...seg, title } : seg))
    );
    triggerAutoSave(undefined, segId);
  };

  const deleteSegment = async (segId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (segments.length <= 1) return;
    const filtered = segments.filter((s) => s.id !== segId);
    setSegments(filtered);

    if (activeSegmentId === segId) {
      setActiveSegmentId(filtered[0].id);
      setActiveSlideId(filtered[0].slides[0]?.id || "");
    }

    if (lessonId) {
      await lessonCacheService.addPendingSync({
        lessonId,
        itemType: "segment",
        itemId: segId,
        action: "DELETE",
        payload: {},
      });
      lessonSyncService.processSyncQueue(lessonId);
    }
  };

  // Slide Operations
  const addSlide = async (segId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!lessonId) return;

    try {
      const newSlide = await builderLessonService.createSlide(lessonId, segId, {
        title: "New Slide",
        coachText: "",
        fen: "",
      });

      const mappedSlide: SlideData = {
        id: newSlide.id,
        title: newSlide.title || "New Slide",
        content: newSlide.coachText || "",
        hasBoard: false,
        fen: "",
        annotations: newSlide.annotations,
      };

      setSegments(
        segments.map((seg) =>
          seg.id === segId
            ? { ...seg, isExpanded: true, slides: [...seg.slides, mappedSlide] }
            : seg
        )
      );

      setActiveSegmentId(segId);
      setActiveSlideId(newSlide.id);
      lessonSyncService.setSyncState(navigator.onLine ? "saved" : "offline");
    } catch (error) {
      console.error("Failed to create slide", error);
    }
  };

  const duplicateSlide = async (segId: string, slideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lessonId) return;

    try {
      const newSlide = await builderLessonService.createSlide(lessonId, segId, {
        duplicateFromSlideId: slideId,
      });

      const mappedSlide: SlideData = {
        id: newSlide.id,
        title: newSlide.title || "Copy",
        content: newSlide.coachText || "",
        hasBoard: Boolean(newSlide.fen && newSlide.fen.trim() !== ""),
        fen: newSlide.fen || "",
        annotations: newSlide.annotations,
      };

      const targetSeg = segments.find((s) => s.id === segId);
      if (!targetSeg) return;

      const slideIdx = targetSeg.slides.findIndex((sl) => sl.id === slideId);
      const newSlides = [...targetSeg.slides];
      newSlides.splice(slideIdx + 1, 0, mappedSlide);

      setSegments(
        segments.map((s) => (s.id === segId ? { ...s, slides: newSlides } : s))
      );

      setActiveSlideId(newSlide.id);
      lessonSyncService.setSyncState(navigator.onLine ? "saved" : "offline");
    } catch (error) {
      console.error("Failed to duplicate slide", error);
    }
  };

  const deleteSlide = async (segId: string, slideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetSeg = segments.find((s) => s.id === segId);
    if (!targetSeg || targetSeg.slides.length <= 1) return;

    const newSlides = targetSeg.slides.filter((sl) => sl.id !== slideId);
    setSegments(
      segments.map((seg) => (seg.id === segId ? { ...seg, slides: newSlides } : seg))
    );

    if (activeSlideId === slideId) {
      setActiveSlideId(newSlides[0]?.id || "");
    }

    if (lessonId) {
      await lessonCacheService.addPendingSync({
        lessonId,
        itemType: "slide",
        itemId: slideId,
        action: "DELETE",
        payload: {},
      });
      lessonSyncService.processSyncQueue(lessonId);
    }
  };

  // Toggle Chessboard on active slide
  const toggleChessboard = () => {
    if (!activeSlide) return;
    const nextHasBoard = !activeSlide.hasBoard;
    const nextFen = nextHasBoard
      ? activeSlide.fen && activeSlide.fen.trim() !== ""
        ? activeSlide.fen
        : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      : "";

    updateActiveSlide({
      hasBoard: nextHasBoard,
      fen: nextFen,
    });
  };

  const [isCalloutActive, setIsCalloutActive] = useState<boolean>(false);

  const isInsideBlockquote = (): boolean => {
    if (typeof window === "undefined") return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
    while (node && node !== document.body) {
      if (node.nodeName && node.nodeName.toUpperCase() === "BLOCKQUOTE") {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  const toggleCoachCallout = () => {
    if (isInsideBlockquote()) {
      formatDocument("formatBlock", "<p>");
      setIsCalloutActive(false);
    } else {
      formatDocument("formatBlock", "<blockquote>");
      setIsCalloutActive(true);
    }
  };

  useEffect(() => {
    const checkSelection = () => {
      setIsCalloutActive(isInsideBlockquote());
    };

    document.addEventListener("selectionchange", checkSelection);
    return () => document.removeEventListener("selectionchange", checkSelection);
  }, []);

  // Slide counter
  let currentSlideNumber = 1;
  let totalSlidesCount = 0;
  segments.forEach((seg) => {
    seg.slides.forEach((sl) => {
      totalSlidesCount++;
      if (sl.id === activeSlideId) {
        currentSlideNumber = totalSlidesCount;
      }
    });
  });

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-brand-bg items-center justify-center text-brand-text">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="mt-4 font-sans text-brand-secondary text-sm">
          Loading lesson builder workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-brand-bg text-brand-text font-sans overflow-hidden select-none">
      {/* ── TOP HEADER & TOOLBAR ────────────────────────────────────────────── */}
      <div className="flex flex-col border-b border-brand-border bg-brand-bg/95 backdrop-blur-md shrink-0 relative z-30">
        {/* Title & Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-brand-border/40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (lessonId) lessonSyncService.processSyncQueue(lessonId);
                navigate("/lessons");
              }}
              title="Back to Lessons Dashboard"
              className="p-1.5 rounded-lg bg-brand-surface border border-brand-border/60 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
              <Layers className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="bg-transparent font-display font-medium text-lg text-brand-text outline-none px-2 py-0.5 rounded-md border border-transparent hover:border-brand-border focus:border-brand-accent/50 focus:bg-brand-surface/50 transition-all duration-200"
                placeholder="Untitled Lesson"
              />
              <span
                title={publishedAt ? `Published on ${new Date(publishedAt).toLocaleDateString()}` : "Status: Draft"}
                className={`text-[11px] font-sans font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                  lessonStatus === "PUBLISHED"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-brand-accent/10 text-brand-accent border-brand-accent/20"
                }`}
              >
                {lessonStatus}
              </span>
            </div>
          </div>

          {/* Right Header Controls: Auto-save status & Action Buttons */}
          <div className="flex items-center gap-4">
            {/* Auto-save & Multi-layer Status Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              {saveStatus === "saving_local" && (
                <span className="flex items-center gap-1.5 text-brand-accent">
                  <HardDrive className="w-3.5 h-3.5 animate-pulse text-brand-accent" />
                  <span>Saving locally...</span>
                </span>
              )}
              {saveStatus === "syncing" && (
                <span className="flex items-center gap-1.5 text-blue-400">
                  <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
                  <span>Syncing...</span>
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === "offline" && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline (cached)</span>
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1.5 text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Sync failed</span>
                </span>
              )}
            </div>

            <button
              onClick={addSegment}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text text-xs font-medium transition-all duration-200 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-brand-accent" />
              <span>Add Segment</span>
            </button>

            <button
              onClick={() => addSlide(activeSegmentId)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text text-xs font-medium transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-brand-accent" />
              <span>Add Slide</span>
            </button>

            {/* Primary Publish Action */}
            <button
              type="button"
              onClick={() => setPublishModalOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all duration-200 cursor-pointer ${
                lessonStatus === "PUBLISHED"
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                  : "bg-brand-accent text-brand-bg hover:bg-brand-accent-hover"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lessonStatus === "PUBLISHED" ? "Published" : "Publish Lesson"}</span>
            </button>
          </div>
        </div>

        {/* Expanded Chess Lesson Text Editing Toolbar */}
        <div className="flex items-center justify-between px-6 py-2 bg-brand-surface/40 border-t border-brand-border/30 select-none relative z-30 overflow-visible">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* History */}
            <button
              title="Undo"
              onClick={() => formatDocument("undo")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
            >
              <Undo className="w-[18px] h-[18px]" />
            </button>
            <button
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
              title="Bold"
              onClick={() => formatDocument("bold")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer font-bold"
            >
              <Bold className="w-[18px] h-[18px]" />
            </button>
            <button
              title="Italic"
              onClick={() => formatDocument("italic")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer italic"
            >
              <Italic className="w-[18px] h-[18px]" />
            </button>
            <button
              title="Underline"
              onClick={() => formatDocument("underline")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer underline"
            >
              <Underline className="w-[18px] h-[18px]" />
            </button>

            <div className="w-px h-5 bg-brand-border mx-1" />

            {/* Lists */}
            <button
              title="Bulleted List"
              onClick={() => formatDocument("insertUnorderedList")}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
            >
              <List className="w-[18px] h-[18px]" />
            </button>
            <button
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
              title="Zoom In"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-[18px] h-[18px]" />
            </button>

            <div className="w-px h-5 bg-brand-border mx-1" />

            {/* Chessboard Toggle */}
            <button
              title={activeSlide?.hasBoard ? "Remove Board" : "Insert Interactive Chessboard"}
              onClick={toggleChessboard}
              className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
                activeSlide?.hasBoard
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
      </div>

      {/* ── WORKSPACE SPLIT: SIDEBAR + CANVAS ─────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Sidebar: Segments & Slides with Drag & Drop */}
        <LessonBuilderSidebar
          segments={segments}
          setSegments={setSegments}
          activeSegmentId={activeSegmentId}
          setActiveSegmentId={setActiveSegmentId}
          activeSlideId={activeSlideId}
          setActiveSlideId={(slideId) => {
            const parentSeg = segments.find((s) => s.slides.some((sl) => sl.id === slideId));
            handleSelectSlide(slideId, parentSeg?.id || activeSegmentId);
          }}
          onAddSegment={addSegment}
          onToggleSegment={toggleSegment}
          onUpdateSegmentTitle={updateSegmentTitle}
          onDeleteSegment={deleteSegment}
          onAddSlide={addSlide}
          onDuplicateSlide={duplicateSlide}
          onDeleteSlide={deleteSlide}
          onAutoSaveTrigger={() => triggerAutoSave()}
        />

        {/* Center Main Workspace Canvas */}
        <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 bg-brand-bg overflow-y-auto relative">
          <LessonCanvas
            content={activeSlide?.content || ""}
            onContentChange={(newContent) => updateActiveSlide({ content: newContent })}
            hasBoard={activeSlide?.hasBoard || false}
            fen={activeSlide?.fen}
            onFenChange={(newFen) => updateActiveSlide({ fen: newFen })}
            onRemoveBoard={() => updateActiveSlide({ hasBoard: false })}
            zoomLevel={zoomLevel}
            onContextMenu={(x, y) => {
              saveCurrentSelection();
              setContextMenuPos({ x, y });
            }}
          />
        </main>
      </div>

      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          hasSelection={hasTextSelection}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onLink={handleContextMenuLink}
          onSelectAll={handleSelectAll}
          onClose={() => setContextMenuPos(null)}
        />
      )}

      {/* ── FOOTER STATUS BAR ──────────────────────────────────────────────── */}
      <footer className="h-8 border-t border-brand-border bg-brand-bg px-6 flex items-center justify-between text-xs text-brand-secondary shrink-0">
        <div className="flex items-center gap-4 font-sans">
          <span>
            Slide <strong className="text-brand-text">{currentSlideNumber}</strong> of{" "}
            <strong className="text-brand-text">{totalSlidesCount}</strong>
          </span>
          <span className="text-brand-border">•</span>
          <span className="text-brand-secondary/80">
            {activeSegment?.title || "Segment"}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>16:9 Canvas</span>
          <span className="text-brand-border">•</span>
          <span>1920 × 1080</span>
        </div>
      </footer>

      {/* Publish Confirmation Modal */}
      {publishModalOpen && (
        <PublishConfirmationModal
          currentStatus={lessonStatus}
          isPublishing={isPublishing}
          isSavingDraft={isSavingDraft}
          onConfirmPublish={handlePublishLesson}
          onSaveAsDraft={handleSaveAsDraftAndExit}
          onClose={() => setPublishModalOpen(false)}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-[120] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border font-sans text-xs select-none animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50"
              : "bg-red-950/90 text-red-200 border-red-500/40 shadow-red-950/50"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Auth Modal for Session Synchronization */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
}
