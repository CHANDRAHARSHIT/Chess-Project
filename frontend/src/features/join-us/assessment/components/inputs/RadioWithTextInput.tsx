import { soundManager } from '@/shared/lib/SoundManager';
import LongTextInput from './LongTextInput';
import ShortTextInput from './ShortTextInput';

interface RadioWithTextInputProps {
  id: string;
  selectedRadio: string;
  textValue: string;
  onRadioChange: (val: string) => void;
  onTextChange: (val: string) => void;
  options: { value: string; label: string }[];
  conditionalTextOnValue?: string; // e.g. 'make_change' or 'all'
  conditionalTextFieldLabel?: string;
  conditionalWordLimit?: number;
  placeholder?: string;
  disabled?: boolean;
}

export default function RadioWithTextInput({
  id,
  selectedRadio,
  textValue,
  onRadioChange,
  onTextChange,
  options,
  conditionalTextOnValue = 'all',
  conditionalTextFieldLabel,
  conditionalWordLimit,
  placeholder,
  disabled = false,
}: RadioWithTextInputProps) {
  const showTextField =
    conditionalTextOnValue === 'all' ||
    (conditionalTextOnValue && selectedRadio === conditionalTextOnValue);

  const handleSelectRadio = (val: string) => {
    if (disabled) return;
    soundManager.playButtonClick();
    onRadioChange(val);
  };

  return (
    <div className="space-y-4">
      {/* Radio options */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {options.map((opt) => {
          const isSelected = selectedRadio === opt.value;
          return (
            <label
              key={opt.value}
              onClick={() => handleSelectRadio(opt.value)}
              className={`flex items-start gap-3 px-5 py-3 rounded-xl border transition-all duration-200 cursor-pointer select-none text-sm sm:text-base font-medium ${
                isSelected
                  ? 'bg-brand-accent/15 border-brand-accent text-brand-accent shadow-[0_0_15px_rgba(212,175,110,0.12)]'
                  : 'bg-brand-surface/60 border-brand-text/15 text-brand-text hover:border-brand-text/30 hover:bg-brand-surface'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`w-5 h-5 shrink-0 mt-0.5 rounded-full border flex items-center justify-center transition-all ${
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

      {/* Conditional / Follow-up text input */}
      {showTextField && (
        <div className="pt-2 pl-1 border-l-2 border-brand-accent/40 space-y-2 ml-1">
          {conditionalTextFieldLabel && (
            <label
              htmlFor={`${id}-text`}
              className="block text-xs sm:text-sm font-medium text-brand-secondary pl-3"
            >
              {conditionalTextFieldLabel}
            </label>
          )}
          <div className="pl-3">
            {conditionalWordLimit && conditionalWordLimit <= 5 ? (
              <ShortTextInput
                id={`${id}-text`}
                value={textValue}
                onChange={onTextChange}
                wordLimit={conditionalWordLimit}
                placeholder={placeholder || 'Enter details...'}
                disabled={disabled}
              />
            ) : (
              <LongTextInput
                id={`${id}-text`}
                value={textValue}
                onChange={onTextChange}
                wordLimit={conditionalWordLimit}
                placeholder={placeholder || 'Enter details...'}
                rows={4}
                disabled={disabled}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
