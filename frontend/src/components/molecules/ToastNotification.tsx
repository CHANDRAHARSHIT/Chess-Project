import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastNotificationProps {
  type?: "success" | "error" | "info";
  message: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  type = "info",
  message,
  onClose,
  className = "",
}) => {
  const icon = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-brand-accent shrink-0" />,
  }[type];

  const borderStyles = {
    success: "border-emerald-500/30 bg-emerald-500/10",
    error: "border-red-500/30 bg-red-500/10",
    info: "border-brand-accent/30 bg-brand-surface",
  }[type];

  return (
    <div
      className={`flex items-center gap-3 p-3.5 rounded border shadow-lg text-sm text-brand-text backdrop-blur-md ${borderStyles} ${className}`}
    >
      {icon}
      <div className="flex-1 font-sans leading-snug">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-brand-secondary hover:text-brand-text p-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default ToastNotification;
