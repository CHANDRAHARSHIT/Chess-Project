import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface AssessmentTimerProps {
  initialSeconds: number;
  onExpire?: () => void;
  isPaused?: boolean;
}

export default function AssessmentTimer({
  initialSeconds,
  onExpire,
  isPaused = false,
}: AssessmentTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, secondsLeft, onExpire]);

  // Format as HH:MM:SS
  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(
    minutes
  ).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Urgency color cues
  const isDanger = secondsLeft <= 300; // Under 5 mins
  const isWarning = secondsLeft > 300 && secondsLeft <= 900; // Under 15 mins

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all duration-300 select-none ${
        isDanger
          ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse'
          : isWarning
          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
          : 'bg-brand-surface/80 border-brand-text/15 text-brand-text'
      }`}
      aria-label={`Time remaining: ${formattedTime}`}
    >
      <Clock
        className={`w-5 h-5 ${
          isDanger
            ? 'text-red-400'
            : isWarning
            ? 'text-amber-400'
            : 'text-brand-accent'
        }`}
      />
      <div className="flex flex-col text-right">
        <span className="font-mono text-base font-bold tracking-wider leading-none">
          {formattedTime}
        </span>
        <span className="text-[10px] uppercase font-mono tracking-widest text-brand-secondary/80 mt-0.5">
          Time Remaining
        </span>
      </div>
    </div>
  );
}
