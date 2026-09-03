import React from "react";
import { User } from "lucide-react";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  name,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  }[size];

  const getInitials = (n?: string) => {
    if (!n) return null;
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-brand-surface border border-brand-border text-brand-text select-none shrink-0 ${sizeClasses} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : initials ? (
        <span className="font-semibold font-mono tracking-tight text-brand-accent">
          {initials}
        </span>
      ) : (
        <User className="w-1/2 h-1/2 text-brand-secondary" />
      )}
    </div>
  );
};

export default Avatar;
