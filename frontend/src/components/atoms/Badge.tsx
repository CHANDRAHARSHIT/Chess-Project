import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "secondary" | "success" | "danger" | "info" | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  variant = "gold",
  size = "sm",
  ...props
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  }[size];

  const variantStyles = {
    gold: "bg-brand-accent/15 text-brand-accent border border-brand-accent/25",
    secondary: "bg-brand-surface text-brand-secondary border border-brand-border",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    danger: "bg-red-500/15 text-red-400 border border-red-500/25",
    info: "bg-sky-500/15 text-sky-400 border border-sky-500/25",
    outline: "bg-transparent text-brand-secondary border border-brand-secondary/30",
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded tracking-wide uppercase select-none ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
