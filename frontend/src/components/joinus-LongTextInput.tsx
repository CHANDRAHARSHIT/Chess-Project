import React from 'react';
import { pluralize } from '@/lib/pluralize';

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
  placeholder = 'Answer',
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
          className={`w-full px-4 py-3 bg-brand-surface/70 border border-brand-text/20 rounded-xl text-brand-text placeholder:text-brand-secondary/50 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all duration-200 font-sans text-sm sm:text-base leading-relaxed resize-y min-h-[110px] ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        />
      </div>

      <div className={`text-xs font-mono ${isOverLimit ? 'text-red-500' : 'text-brand-secondary'}`}>
        {wordLimit
          ? `${wordCount} / ${wordLimit} ${pluralize(wordLimit, 'word')}`
          : `${wordCount} ${pluralize(wordCount, 'word')}`}
      </div>
    </div>
  );
}
