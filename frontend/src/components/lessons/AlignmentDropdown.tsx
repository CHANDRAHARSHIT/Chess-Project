import { useState, useRef, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight, ChevronDown, Check } from "lucide-react";

export interface AlignmentDropdownProps {
  onSelectAlign: (cmd: string) => void;
}

export function AlignmentDropdown({ onSelectAlign }: AlignmentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAlign, setActiveAlign] = useState<"left" | "center" | "right">("left");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { id: "left", label: "Align Left", icon: AlignLeft, cmd: "justifyLeft" },
    { id: "center", label: "Align Center", icon: AlignCenter, cmd: "justifyCenter" },
    { id: "right", label: "Align Right", icon: AlignRight, cmd: "justifyRight" },
  ];

  const CurrentIcon =
    activeAlign === "center"
      ? AlignCenter
      : activeAlign === "right"
      ? AlignRight
      : AlignLeft;

  return (
    <div ref={dropdownRef} className="relative inline-block text-left z-40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Text Alignment"
        className="flex items-center gap-1 p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-colors cursor-pointer border border-brand-border/50 bg-brand-surface/60"
      >
        <CurrentIcon className="w-[18px] h-[18px]" />
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-32 rounded-lg bg-brand-surface border border-brand-border shadow-2xl z-50 py-1 font-sans">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelectAlign(opt.cmd);
                  setActiveAlign(opt.id as any);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  activeAlign === opt.id
                    ? "text-brand-accent bg-brand-accent/10 font-semibold"
                    : "text-brand-text hover:bg-brand-text/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </div>
                {activeAlign === opt.id && <Check className="w-3 h-3 text-brand-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
