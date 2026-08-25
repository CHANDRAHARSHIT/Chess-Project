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
    <div className="hidden md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-surface/80 border-b border-brand-text/15 text-brand-secondary text-xs uppercase font-mono tracking-wider">
              <th className="p-4 sm:p-5 font-semibold text-brand-text">
                Department
              </th>
              {JOB_LEVELS.map((level) => (
                <th
                  key={level}
                  className="p-4 sm:p-5 font-semibold text-center whitespace-nowrap"
                >
                  Level: {level}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-text/10">
            {DEPARTMENTS.map((dept: Department) => (
              <tr
                key={dept}
                className="hover:bg-brand-surface/50 transition-colors duration-150"
              >
                <td className="p-4 sm:p-5 font-medium text-brand-text text-sm whitespace-nowrap">
                  {dept}
                </td>
                {JOB_LEVELS.map((level: JobLevel) => {
                  const activeOpening = getOpening(dept, level);

                  return (
                    <td key={level} className="p-4 sm:p-5 text-center">
                      {activeOpening ? (
                        <button
                          type="button"
                          onClick={() => handleOpeningClick(activeOpening)}
                          className="group relative inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-brand-accent/10 text-brand-accent border border-brand-accent/30 hover:border-brand-accent/60 hover:bg-brand-accent hover:text-brand-bg transition-all duration-200 cursor-pointer w-full max-w-[130px]"
                          aria-label={`View ${dept} ${level} opening details`}
                        >
                          <span>Hiring</span>
                          <span className="sr-only"> - View Details</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs font-medium text-brand-secondary/70 bg-brand-surface/40 border border-brand-text/10 w-full max-w-[130px]">
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

      {/* Note under table */}
      <div className="p-4 sm:p-5 border-t border-brand-text/15 bg-brand-surface/30 flex items-center gap-3 text-brand-secondary text-xs sm:text-sm">
        <Clock className="w-4 h-4 text-brand-accent shrink-0" />
        <p>
          We are flexible with the hours and can make it work around your availability,
          even if you are not able to work full-time.
        </p>
      </div>
    </div>
  );
}
