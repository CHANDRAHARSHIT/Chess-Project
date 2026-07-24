/**
 * OpeningProgressBar.tsx
 *
 * A slim progress bar indicating how far through the opening the user has gotten.
 */

interface OpeningProgressBarProps {
  currentUserStep: number;
  totalUserSteps: number;
  progress: number; // 0–1 fraction
}

export function OpeningProgressBar({
  currentUserStep,
  totalUserSteps,
  progress,
}: OpeningProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <div className="flex items-center gap-3">
      {/* Track */}
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, rgba(212,175,110,0.7) 0%, rgba(212,175,110,1) 100%)",
            boxShadow: pct > 0 ? "0 0 6px rgba(212,175,110,0.4)" : "none",
          }}
        />
      </div>

      {/* Label */}
      <span className="font-mono text-[10px] text-brand-secondary shrink-0 tabular-nums">
        {currentUserStep} / {totalUserSteps}
      </span>
    </div>
  );
}
