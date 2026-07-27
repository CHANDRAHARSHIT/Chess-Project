import type { EngineEvaluation } from "../types/chess";

interface EvaluationBarProps {
  evaluation: EngineEvaluation | null;
  isDesktop: boolean;
  boardHeight?: number;
}

export function EvaluationBar({
  evaluation,
  isDesktop,
  boardHeight,
}: EvaluationBarProps) {
  let evalPercent = 50;
  let evalLabel = "0.0";

  if (evaluation) {
    if (evaluation.type === "cp") {
      const val = evaluation.value;
      const clamped = Math.max(-8, Math.min(8, val));
      evalPercent = ((clamped + 8) / 16) * 100;
      const rounded = parseFloat(val.toFixed(1));
      if (rounded === 0) {
        evalLabel = "0.0";
      } else {
        evalLabel = val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
      }
    } else {
      const val = evaluation.value;
      evalPercent = val > 0 ? 95 : 5;
      evalLabel = `M${Math.abs(val)}`;
    }
  }

  return (
    <div
      className={
        isDesktop
          ? "flex flex-col items-center justify-start gap-0 h-full"
          : "flex flex-row items-center justify-center gap-2 w-full"
      }
      style={{ alignSelf: "stretch", padding: "0" }}
    >
      <div
        className={
          isDesktop
            ? "relative overflow-hidden flex flex-col-reverse items-end w-full"
            : "relative overflow-hidden flex flex-row items-center flex-1 h-full"
        }
        style={{
          width: isDesktop ? "24px" : undefined,
          borderRadius: "0px",
          height: isDesktop && boardHeight ? `${boardHeight}px` : "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(8px)",
          minHeight: isDesktop && boardHeight ? `${boardHeight}px` : undefined,
        }}
      >
        <div
          className="transition-all duration-500 ease-out"
          style={{
            backgroundColor: "#ffffff",
            width: isDesktop ? "100%" : `${evalPercent}%`,
            height: isDesktop ? `${evalPercent}%` : "100%",
          }}
        />
      </div>
      <div
        className={`flex justify-center pointer-events-none ${isDesktop ? "mt-3" : ""}`}
      >
        <span
          className="font-sans text-xs font-normal leading-none"
          style={{
            color: "#8E8B82",
          }}
        >
          {evalLabel}
        </span>
      </div>
    </div>
  );
}
