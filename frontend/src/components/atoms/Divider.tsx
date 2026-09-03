import React from "react";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
}

export const Divider: React.FC<DividerProps> = ({
  strong = false,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`w-full h-px ${
        strong
          ? "bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent"
          : "bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent"
      } my-4 ${className}`}
      {...props}
    />
  );
};

export default Divider;
