import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { soundManager } from "@/shared/lib/SoundManager";

export interface BackButtonProps {
  to?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = "Back",
  onClick,
  className = "",
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    soundManager.playButtonClick();
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group select-none ${className}`}
    >
      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-brand-accent/80 group-hover:text-brand-accent" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
