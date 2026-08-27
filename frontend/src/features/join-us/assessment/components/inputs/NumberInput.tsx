import React from 'react';

interface NumberInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export default function NumberInput({
  id,
  value,
  onChange,
  prefix = 'It would take me',
  suffix = 'minutes.',
  placeholder = '0',
  min = 1,
  max = 999,
  disabled = false,
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits only
    if (raw === '' || /^\d+$/.test(raw)) {
      onChange(raw);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-brand-surface/60 border border-brand-text/15">
      {prefix && (
        <span className="text-brand-text text-sm sm:text-base font-medium">
          {prefix}
        </span>
      )}

      <div className="relative inline-block w-28">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-center bg-brand-surface border border-brand-text/25 rounded-xl font-mono text-base font-bold text-brand-accent focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
        />
      </div>

      {suffix && (
        <span className="text-brand-text text-sm sm:text-base font-medium">
          {suffix}
        </span>
      )}
    </div>
  );
}
