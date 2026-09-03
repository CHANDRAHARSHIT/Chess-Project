import React from "react";

export interface SidePanelProps {
  title?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  title,
  headerAction,
  footer,
  children,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col rounded border border-brand-border bg-brand-surface/90 backdrop-blur-md overflow-hidden ${className}`}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between p-3.5 border-b border-brand-border bg-brand-surface/60 select-none">
          {title && (
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-secondary">
              {title}
            </div>
          )}
          {headerAction}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 sidebar-scrollbar">
        {children}
      </div>
      {footer && (
        <div className="p-3 border-t border-brand-border bg-brand-surface/60">
          {footer}
        </div>
      )}
    </div>
  );
};

export default SidePanel;
