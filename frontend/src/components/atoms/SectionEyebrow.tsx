import React from "react";

export interface SectionEyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SectionEyebrow: React.FC<SectionEyebrowProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`font-mono text-[11px] tracking-[0.2em] uppercase text-brand-accent opacity-80 flex items-center gap-3 select-none ${className}`}
      {...props}
    >
      <span className="w-6 h-px bg-gradient-to-r from-transparent to-brand-accent inline-block" />
      <span>{children}</span>
    </div>
  );
};

export default SectionEyebrow;
