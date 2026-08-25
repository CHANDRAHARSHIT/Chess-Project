import React, { useRef } from 'react';
import { RotateCcw, Copy, Check } from 'lucide-react';
import { useState } from 'react';

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
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, 6);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <div className="w-full rounded-2xl border border-brand-text/20 bg-[#080B14] overflow-hidden shadow-inner font-mono text-xs sm:text-sm">
      {/* Code Editor Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-brand-surface/90 border-b border-brand-text/15 text-brand-secondary">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-brand-accent">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-brand-secondary hover:text-brand-text hover:bg-brand-surface border border-transparent hover:border-brand-text/20 transition-all cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="relative flex min-h-[200px] max-h-[480px]">
        {/* Line Numbers Column */}
        <div
          id={`${id}-linenumbers`}
          className="select-none py-3 pl-3 pr-2 text-right text-brand-secondary/40 font-mono text-xs sm:text-sm bg-brand-surface/30 border-r border-brand-text/10 overflow-hidden leading-6 min-w-[2.5rem]"
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
          className="flex-1 p-3 bg-transparent text-[#F5F0E8] font-mono text-xs sm:text-sm leading-6 resize-none focus:outline-none overflow-y-auto whitespace-pre tab-4"
          style={{ tabSize: 4 }}
        />
      </div>
    </div>
  );
}
