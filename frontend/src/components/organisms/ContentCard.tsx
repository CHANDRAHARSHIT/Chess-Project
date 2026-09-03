import React from "react";
import { Badge } from "../atoms/Badge";
import { soundManager } from "@/shared/lib/SoundManager";

export interface ContentCardProps {
  title: string;
  description?: string;
  image?: string;
  badge?: string;
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  overlayIcon?: React.ReactNode;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  title,
  description,
  image,
  badge,
  meta,
  footer,
  onClick,
  className = "",
  overlayIcon,
}) => {
  const handleClick = () => {
    if (onClick) {
      soundManager.playButtonClick();
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col rounded border border-brand-border bg-brand-surface/80 overflow-hidden transition-all duration-300 ${
        onClick
          ? "cursor-pointer hover:border-brand-accent/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40"
          : ""
      } ${className}`}
    >
      {image && (
        <div className="relative aspect-video w-full overflow-hidden bg-obsidian-light">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 via-obsidian/20 to-transparent opacity-80" />
          {badge && (
            <div className="absolute top-3 left-3 z-10">
              <Badge variant="gold">{badge}</Badge>
            </div>
          )}
          {overlayIcon && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {overlayIcon}
            </div>
          )}
        </div>
      )}

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {meta && <div className="mb-2 text-xs text-brand-secondary">{meta}</div>}
          <h3 className="text-base sm:text-lg font-semibold text-brand-text font-display group-hover:text-brand-accent transition-colors line-clamp-2">
            {title}
          </h3>
          {description && (
            <p className="mt-2 text-xs sm:text-sm text-brand-secondary line-clamp-2 font-sans">
              {description}
            </p>
          )}
        </div>
        {footer && <div className="mt-4 pt-3 border-t border-brand-border/40">{footer}</div>}
      </div>
    </div>
  );
};

export default ContentCard;
