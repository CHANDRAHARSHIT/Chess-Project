import React, { useRef } from 'react';
import { RotateCcw } from 'lucide-react';

interface CodeInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  originalValue?: string;
  language?: string;
  disabled?: boolean;
}

export default function CodeInput({
  id,
  value,
  onChange,
  originalValue,
  language = 'Pseudocode',
  disabled = false,
}: CodeInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, 6);

  const handleReset = () => {
    if (originalValue !== undefined) {
      onChange(originalValue);
    }
  };

  // Sync scrolling between line numbers and textarea
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbers = document.getElementById(`${id}-linenumbers`);
    if (lineNumbers) {
      lineNumbers.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-brand-text/20 bg-brand-bg overflow-hidden shadow-inner font-mono text-xs sm:text-sm">
      {/* Code Editor Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-brand-surface/90 border-b border-brand-text/15 text-brand-secondary">
        <span className="text-xs font-mono uppercase tracking-wider text-brand-accent">
          {language}
        </span>

        {originalValue !== undefined && value !== originalValue && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-brand-secondary hover:text-brand-text hover:bg-brand-surface border border-transparent hover:border-brand-text/20 transition-all cursor-pointer"
            title="Reset to original code"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Editor Body with Line Numbers — fixed height with internal scroll,
          never grows with content. (Flex children need min-h-0, otherwise
          their intrinsic content height overrides the container's max-h.) */}
      <div className="relative flex h-[280px]">
        {/* Line Numbers Column */}
        <div
          id={`${id}-linenumbers`}
          className="select-none py-3 pl-3 pr-2 text-right text-brand-secondary/40 font-mono text-xs sm:text-sm bg-brand-surface/30 border-r border-brand-text/10 overflow-hidden leading-6 min-w-[2.5rem] min-h-0"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Textarea */}
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          disabled={disabled}
          spellCheck={false}
          className="flex-1 min-h-0 p-3 bg-transparent text-brand-text font-mono text-xs sm:text-sm leading-6 resize-none focus:outline-none overflow-y-auto whitespace-pre tab-4"
          style={{ tabSize: 4 }}
        />
      </div>
    </div>
  );
}
