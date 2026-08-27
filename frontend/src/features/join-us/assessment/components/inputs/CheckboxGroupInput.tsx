import { soundManager } from '@/shared/lib/SoundManager';
import { Check } from 'lucide-react';

interface CheckboxGroupInputProps {
  id: string;
  value: string; // Comma-separated selected values (e.g. "A,B,D")
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  maxSelections?: number;
  disabled?: boolean;
}

export default function CheckboxGroupInput({
  id: _id,
  value,
  onChange,
  options,
  maxSelections = 3,
  disabled = false,
}: CheckboxGroupInputProps) {
  const selectedSet = new Set(
    value
      ? value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  );

  const handleToggle = (optionValue: string) => {
    if (disabled) return;
    soundManager.playButtonClick();

    const nextSet = new Set(selectedSet);
    if (nextSet.has(optionValue)) {
      nextSet.delete(optionValue);
    } else {
      if (maxSelections && nextSet.size >= maxSelections) {
        // Already reached limit, prevent adding more
        return;
      }
      nextSet.add(optionValue);
    }

    onChange(Array.from(nextSet).join(','));
  };

  const isLimitReached = maxSelections ? selectedSet.size >= maxSelections : false;

  return (
    <div className="space-y-4">
      {/* Header status count */}
      {maxSelections && (
        <div className="flex items-center justify-between text-xs font-mono">
          <span
            className={
              selectedSet.size === maxSelections
                ? 'text-brand-accent font-semibold'
                : 'text-brand-secondary'
            }
          >
            {selectedSet.size} / {maxSelections} selected
          </span>
          {isLimitReached && (
            <span className="text-brand-accent/80">
              Maximum selections reached
            </span>
          )}
        </div>
      )}

      {/* Options list */}
      <div className="space-y-2.5">
        {options.map((opt) => {
          const isSelected = selectedSet.has(opt.value);
          const isDisabled = disabled || (!isSelected && isLimitReached);

          return (
            <label
              key={opt.value}
              onClick={() => handleToggle(opt.value)}
              className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none text-sm sm:text-base leading-relaxed ${
                isSelected
                  ? 'bg-brand-accent/15 border-brand-accent text-brand-text shadow-[0_0_15px_rgba(212,175,110,0.12)]'
                  : isDisabled
                  ? 'bg-brand-surface/30 border-brand-text/10 text-brand-secondary/50 cursor-not-allowed'
                  : 'bg-brand-surface/60 border-brand-text/15 text-brand-text hover:border-brand-text/30 hover:bg-brand-surface'
              }`}
            >
              {/* Checkbox box */}
              <div
                className={`w-5 h-5 rounded-none border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  isSelected
                    ? 'border-brand-accent bg-brand-accent text-brand-bg font-bold'
                    : 'border-brand-text/30 bg-transparent'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              {/* Option text */}
              <div className="flex-1">
                <span className="font-semibold text-brand-accent mr-2 font-mono">
                  {opt.value}.
                </span>
                <span>{opt.label}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
