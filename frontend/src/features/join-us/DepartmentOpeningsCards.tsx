import {
  DEPARTMENTS,
  JOB_LEVELS,
  getOpening,
  type Department,
  type JobLevel,
  type JobOpening,
} from "./joinUsData";
import { soundManager } from "@/shared/lib/SoundManager";
import { Clock } from "lucide-react";

interface DepartmentOpeningsCardsProps {
  onSelectOpening: (opening: JobOpening) => void;
}

export default function DepartmentOpeningsCards({
  onSelectOpening,
}: DepartmentOpeningsCardsProps) {
  const handleOpeningClick = (opening: JobOpening) => {
    soundManager.playButtonClick();
    onSelectOpening(opening);
  };

  return (
    <div className="md:hidden">
      <div className="divide-y divide-brand-text/10">
        {DEPARTMENTS.map((dept: Department) => (
          <div key={dept} className="p-5 flex flex-col space-y-4">
            <h3 className="font-display font-semibold text-lg text-brand-text border-b border-brand-text/15 pb-2">
              {dept}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {JOB_LEVELS.map((level: JobLevel) => {
                const activeOpening = getOpening(dept, level);

                return (
                  <div
                    key={level}
                    className="bg-brand-surface/50 border border-brand-text/15 p-3 rounded-2xl flex flex-col items-center text-center space-y-2 hover:border-brand-accent/40 transition-colors"
                  >
                    <span className="text-[11px] text-brand-secondary font-mono uppercase tracking-wider">
                      {level}
                    </span>
                    {activeOpening ? (
                      <button
                        type="button"
                        onClick={() => handleOpeningClick(activeOpening)}
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-accent/10 text-brand-accent border border-brand-accent/30 hover:border-brand-accent/60 hover:bg-brand-accent hover:text-brand-bg transition-all duration-200 cursor-pointer active:scale-95"
                        aria-label={`View ${dept} ${level} opening details`}
                      >
                        Hiring
                      </button>
                    ) : (
                      <span className="w-full px-3 py-1.5 rounded-xl text-xs font-medium text-brand-secondary/60 bg-brand-surface/30 border border-brand-text/10">
                        Not Hiring
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Note under cards */}
      <div className="p-4 border-t border-brand-text/15 bg-brand-surface/30 flex items-start gap-2.5 text-brand-secondary text-xs leading-relaxed">
        <Clock className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
        <p>
          We are flexible with the hours and can make it work around your
          availability, even if you are not able to work full-time.
        </p>
      </div>
    </div>
  );
}
