import React from 'react';
import { pluralize } from '@/shared/lib/pluralize';

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
  placeholder = 'Answer',
  disabled = false,
}: ShortTextInputProps) {
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
          className={`w-full px-4 py-3 bg-brand-surface/70 border border-brand-text/20 rounded-xl text-brand-text placeholder:text-brand-secondary/50 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all duration-200 font-mono text-sm sm:text-base ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        />
      </div>

      <div className={`text-xs font-mono ${isOverLimit ? 'text-red-500' : 'text-brand-secondary'}`}>
        {wordCount} / {wordLimit} {pluralize(wordLimit, 'word')}
      </div>
    </div>
  );
}
