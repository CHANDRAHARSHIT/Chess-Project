import React from 'react';

interface ShortTextInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  wordLimit?: number;
  placeholder?: string;
  disabled?: boolean;
}

export default function ShortTextInput({
  id,
  value,
  onChange,
  wordLimit = 1,
  placeholder = 'Enter your answer...',
  disabled = false,
}: ShortTextInputProps) {
  // Count words
  const trimmed = value.trim();
  const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  const isOverLimit = wordLimit ? wordCount > wordLimit : false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-4 py-3 bg-brand-surface/70 border rounded-xl text-brand-text placeholder:text-brand-secondary/50 focus:outline-none transition-all duration-200 font-mono text-sm sm:text-base ${
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
          {wordCount} / {wordLimit} {wordLimit === 1 ? 'word' : 'words'}
        </span>
        {isOverLimit && (
          <span className="text-red-400">
            Please reduce by {wordCount - wordLimit} {wordCount - wordLimit === 1 ? 'word' : 'words'}
          </span>
        )}
      </div>
    </div>
  );
}
