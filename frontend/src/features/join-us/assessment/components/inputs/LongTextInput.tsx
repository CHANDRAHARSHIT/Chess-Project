import React from 'react';

interface LongTextInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  wordLimit?: number;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export default function LongTextInput({
  id,
  value,
  onChange,
  wordLimit,
  placeholder = 'Write your response here...',
  rows = 5,
  disabled = false,
}: LongTextInputProps) {
  const trimmed = value.trim();
  const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  const isOverLimit = wordLimit ? wordCount > wordLimit : false;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative">
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-4 py-3 bg-brand-surface/70 border rounded-xl text-brand-text placeholder:text-brand-secondary/50 focus:outline-none transition-all duration-200 font-sans text-sm sm:text-base leading-relaxed resize-y min-h-[110px] ${
            isOverLimit
              ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-brand-text/20 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
      </div>

      <div className="flex justify-between items-center text-xs font-mono">
        <span
          className={
            isOverLimit
              ? 'text-red-400 font-semibold'
              : 'text-brand-secondary'
          }
        >
          {wordLimit ? `${wordCount} / ${wordLimit} words` : `${wordCount} words`}
        </span>
        {isOverLimit && wordLimit && (
          <span className="text-red-400">
            Exceeds limit by {wordCount - wordLimit} words
          </span>
        )}
      </div>
    </div>
  );
}
