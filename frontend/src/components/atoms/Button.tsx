import React from "react";
import { soundManager } from "@/shared/lib/SoundManager";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold-solid" | "gold-outline" | "ghost" | "danger" | "cta" | "secondary";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  playSound?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "gold-solid",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      playSound = true,
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (playSound && !disabled && !isLoading) {
        soundManager.playButtonClick();
      }
      onClick?.(e);
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2.5",
    }[size];

    const variantStyles = {
      "gold-solid":
        "btn-gold-solid bg-brand-accent text-obsidian font-semibold hover:bg-[#c49f5e] active:scale-[0.98] shadow-sm",
      "gold-outline":
        "btn-gold-outline border border-brand-accent/40 text-brand-accent bg-transparent hover:bg-brand-accent/10 active:scale-[0.98]",
      cta: "btn-premium-cta font-mono tracking-wider uppercase text-brand-accent",
      ghost:
        "bg-transparent text-brand-secondary hover:text-brand-text hover:bg-brand-accent/10",
      secondary:
        "bg-brand-surface border border-brand-border text-brand-text hover:border-brand-accent/30 active:scale-[0.98]",
      danger:
        "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-[0.98]",
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={`inline-flex items-center justify-center rounded transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
