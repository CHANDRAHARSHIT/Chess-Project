import type { EngineEvaluation } from '../types/chess';

interface EvaluationBarProps {
  evaluation: EngineEvaluation | null;
  isDesktop: boolean;
  boardHeight?: number;
}

export function EvaluationBar({ evaluation, isDesktop, boardHeight }: EvaluationBarProps) {
  let evalPercent = 50;
  let evalLabel = '0.0';
  let evalIsNegative = false;

  if (evaluation) {
    if (evaluation.type === 'cp') {
      const val = evaluation.value;
      const clamped = Math.max(-8, Math.min(8, val));
      evalPercent = ((clamped + 8) / 16) * 100;
      evalIsNegative = val < 0;
      const rounded = parseFloat(val.toFixed(1));
      if (rounded === 0) {
        evalLabel = '0.0';
      } else {
        evalLabel = val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
      }
    } else {
      const val = evaluation.value;
      evalPercent = val > 0 ? 95 : 5;
      evalIsNegative = val < 0;
      evalLabel = `M${Math.abs(val)}`;
    }
  }

  return (
    <div
      className="flex lg:flex-col items-center justify-center gap-2"
      style={{ alignSelf: 'stretch', padding: '0' }}
    >
      <div
        className="relative overflow-hidden flex lg:flex-col-reverse items-start lg:items-end w-full h-full"
        style={{
          width: isDesktop ? '24px' : '100%',
          borderRadius: '8px',
          height: isDesktop && boardHeight ? `${boardHeight}px` : '16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
          minHeight: isDesktop && boardHeight ? `${boardHeight}px` : undefined,
        }}
      >
        <div
          className="bg-white/80 transition-all duration-500 ease-out"
          style={{
            width: isDesktop ? '100%' : `${evalPercent}%`,
            height: isDesktop ? `${evalPercent}%` : '100%',
          }}
        />
      </div>
      <div className="flex justify-center pointer-events-none">
        <span
          className="font-mono font-semibold text-sm sm:text-base lg:text-lg px-2 py-1 shadow-sm leading-none rounded-md"
          style={{
            backgroundColor: '#ffffff',
            color: '#111827',
          }}
        >
          {evalLabel}
        </span>
      </div>
    </div>
  );
}
