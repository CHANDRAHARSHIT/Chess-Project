import {
  DEPARTMENTS,
  JOB_LEVELS,
  getOpening,
  type Department,
  type JobLevel,
  type JobOpening,
} from "./joinUsData";
import { soundManager } from "@/shared/lib/SoundManager";

interface DepartmentOpeningsTableProps {
  onSelectOpening: (opening: JobOpening) => void;
}

export default function DepartmentOpeningsTable({
  onSelectOpening,
}: DepartmentOpeningsTableProps) {
  const handleOpeningClick = (opening: JobOpening) => {
    soundManager.playButtonClick();
    onSelectOpening(opening);
  };

  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-brand-surface/80 border-b border-brand-border/50 text-brand-secondary text-xs uppercase font-mono tracking-wider">
            <th className="p-4 font-semibold">Department</th>
            {JOB_LEVELS.map((level) => (
              <th key={level} className="p-4 font-semibold text-center">
                {level}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/30">
          {DEPARTMENTS.map((dept: Department) => (
            <tr
              key={dept}
              className="hover:bg-brand-surface/30 transition-colors duration-150"
            >
              <td className="p-4 font-medium text-brand-text text-sm">
                {dept}
              </td>
              {JOB_LEVELS.map((level: JobLevel) => {
                const activeOpening = getOpening(dept, level);

                return (
                  <td key={level} className="p-4 text-center">
                    {activeOpening ? (
                      <button
                        type="button"
                        onClick={() => handleOpeningClick(activeOpening)}
                        className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-accent/10 text-brand-accent border border-brand-accent/30 hover:bg-brand-accent hover:text-brand-bg transition-all duration-200 cursor-pointer w-full max-w-[110px] shadow-sm hover:shadow"
                        aria-label={`View ${dept} ${level} opening details`}
                      >
                        View Details
                      </button>
                    ) : (
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium text-brand-secondary bg-brand-surface/60 border border-brand-border/40 w-full max-w-[110px]">
                        Not Hiring
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
