import React from "react";
import { IconBox } from "../atoms/IconBox";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  subPositive?: boolean | null;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  subPositive,
  icon,
  className = "",
}) => {
  return (
    <div
      className={`p-5 rounded border border-brand-border bg-brand-surface/70 backdrop-blur-sm flex flex-col justify-between transition-all duration-200 hover:border-brand-accent/30 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-brand-secondary">
          {label}
        </span>
        {icon && <IconBox icon={icon} size="sm" variant="accent-subtle" />}
      </div>
      <div>
        <div className="text-2xl font-display font-semibold text-brand-text tracking-tight">
          {value}
        </div>
        {subValue && (
          <div
            className={`text-xs mt-1.5 font-sans ${
              subPositive === true
                ? "text-emerald-400"
                : subPositive === false
                ? "text-red-400"
                : "text-brand-secondary"
            }`}
          >
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
