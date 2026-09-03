import React from "react";
import { IconBox } from "../atoms/IconBox";

export interface EmptyStateProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded border border-dashed border-brand-border bg-brand-surface/30 ${className}`}
    >
      {icon && <div className="mb-4"><IconBox icon={icon} size="lg" variant="surface" /></div>}
      <h3 className="text-lg font-semibold text-brand-text font-sans">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-brand-secondary mt-1.5 max-w-md font-sans">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
