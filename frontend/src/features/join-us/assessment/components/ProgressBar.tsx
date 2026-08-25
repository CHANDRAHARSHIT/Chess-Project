interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
}

export default function ProgressBar({
  currentQuestion,
  totalQuestions,
}: ProgressBarProps) {
  const percentage = Math.min(
    100,
    Math.round((currentQuestion / totalQuestions) * 100)
  );

  return (
    <div className="w-full space-y-2 select-none">
      <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-semibold">
        <div className="flex items-center gap-2 text-brand-text">
          <span className="text-brand-secondary">Progress:</span>
          <span className="text-brand-accent">
            {currentQuestion} / {totalQuestions}
          </span>
        </div>
        <div className="text-brand-accent">{percentage}%</div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-brand-surface border border-brand-text/15 rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-gradient-to-r from-brand-accent/80 to-brand-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
