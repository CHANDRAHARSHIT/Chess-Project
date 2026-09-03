import React from "react";

export interface IconBoxProps {
  icon: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "gold" | "surface" | "accent-subtle";
  className?: string;
}

export const IconBox: React.FC<IconBoxProps> = ({
  icon,
  size = "md",
  variant = "gold",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }[size];

  const variantClasses = {
    gold: "bg-brand-accent/10 border-brand-accent/25 text-brand-accent",
    surface: "bg-brand-surface border-brand-border text-brand-text",
    "accent-subtle": "bg-brand-accent/5 border-brand-accent/15 text-brand-secondary",
  }[variant];

  return (
    <div
      className={`rounded flex items-center justify-center border transition-all duration-200 ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon}
    </div>
  );
};

export default IconBox;
