import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const PREDEFINED_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;

export interface FontSizeControlProps {
  onApplyFontSize: (size: number) => void;
}

export function FontSizeControl({ onApplyFontSize }: FontSizeControlProps) {
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
