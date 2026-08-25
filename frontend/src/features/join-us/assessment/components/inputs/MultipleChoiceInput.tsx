import { soundManager } from '@/shared/lib/SoundManager';

interface MultipleChoiceInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export default function MultipleChoiceInput({
  id,
  value,
  onChange,
  options,
  disabled = false,
}: MultipleChoiceInputProps) {
  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    soundManager.playButtonClick();
    onChange(optionValue);
  };

  return (
    <div className="flex flex-wrap gap-4 pt-1" role="radiogroup" aria-labelledby={id}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <label
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-200 cursor-pointer select-none text-sm sm:text-base font-medium ${
              isSelected
                ? 'bg-brand-accent/15 border-brand-accent text-brand-accent shadow-[0_0_15px_rgba(212,175,110,0.12)]'
                : 'bg-brand-surface/60 border-brand-text/15 text-brand-text hover:border-brand-text/30 hover:bg-brand-surface'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                isSelected
                  ? 'border-brand-accent bg-brand-accent text-brand-bg'
                  : 'border-brand-text/30 bg-transparent'
              }`}
            >
              {isSelected && <div className="w-2 h-2 rounded-full bg-brand-bg" />}
            </div>
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
