import {
  DEPARTMENTS,
  JOB_LEVELS,
  getOpening,
  type Department,
  type JobLevel,
  type JobOpening,
} from "./joinUsData";
import { soundManager } from "@/shared/lib/SoundManager";

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
    <div className="md:hidden divide-y divide-brand-border/30">
      {DEPARTMENTS.map((dept: Department) => (
        <div key={dept} className="p-5 flex flex-col space-y-4">
          <h3 className="font-display font-semibold text-lg text-brand-text border-b border-brand-border/40 pb-2">
            {dept}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {JOB_LEVELS.map((level: JobLevel) => {
              const activeOpening = getOpening(dept, level);

              return (
                <div
                  key={level}
                  className="bg-brand-surface/40 border border-brand-border/30 p-3 rounded-xl flex flex-col items-center text-center space-y-2"
                >
                  <span className="text-xs text-brand-secondary font-mono uppercase tracking-wider">
                    {level}
                  </span>
                  {activeOpening ? (
                    <button
                      type="button"
                      onClick={() => handleOpeningClick(activeOpening)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-accent/10 text-brand-accent border border-brand-accent/30 hover:bg-brand-accent hover:text-brand-bg transition-all duration-200 cursor-pointer active:scale-95"
                      aria-label={`Apply for ${dept} ${level} opening`}
                    >
                      Apply
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-brand-secondary">
                      Closed
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
