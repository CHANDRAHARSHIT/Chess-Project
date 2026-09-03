import { useRef, useEffect } from "react";
import { RotateCcw } from "lucide-react";

export interface CoachMessage {
  id: number | string;
  text: string;
  type?: "default" | "correct" | "hint";
}

export interface CoachChatBoxProps {
  title?: string;
  subtitle?: string;
  avatarSrc?: string;
  messages: CoachMessage[];
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
}

export function CoachChatBox({
  title = "Coach",
  subtitle = "Puzzle guide",
  avatarSrc = "/coach.png",
  messages,
  onReset,
  resetLabel = "Reset puzzle",
  className = "",
}: CoachChatBoxProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat container to bottom when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <aside
      className={`rounded-2xl backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between min-h-[260px] md:min-h-0 ${className}`}
      style={{
        border: "1px solid var(--marble-border)",
        background: "var(--glass-bg)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 pb-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--marble-border)" }}
      >
        <div
          className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
          style={{
            border: "2px solid var(--marble-border-strong)",
            background: "var(--gold-whisper)",
          }}
        >
          <img
            src={avatarSrc}
            alt={title}
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-neutral-900" />
        </div>
        <div>
          <h3
            className="font-display font-bold text-sm sm:text-base leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
          <p
            className="text-[11px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* Chat Message Bubble List */}
      <div
        ref={chatContainerRef}
        className="flex-1 my-3 overflow-y-auto space-y-2.5 pr-1 max-h-[220px] md:max-h-[280px]"
        aria-live="polite"
      >
        {messages.map((msg) => {
          let bubbleStyle: React.CSSProperties = {
            animation: "bubbleFadeIn 0.25s ease-out both",
            border: "1px solid var(--marble-border)",
            background: "var(--marble-light)",
            color: "var(--text-primary)",
          };

          if (msg.type === "correct") {
            bubbleStyle = {
              ...bubbleStyle,
              borderColor: "rgba(16, 185, 129, 0.45)",
              background: "rgba(16, 185, 129, 0.12)",
              color: "var(--text-primary)",
            };
          } else if (msg.type === "hint") {
            bubbleStyle = {
              ...bubbleStyle,
              borderColor: "rgba(168, 85, 247, 0.45)",
              background: "rgba(168, 85, 247, 0.12)",
              color: "var(--text-primary)",
            };
          }

          return (
            <div
              key={msg.id}
              className="p-3 text-xs leading-relaxed rounded-2xl rounded-tl-sm transition-all duration-200 shadow-sm"
              style={bubbleStyle}
            >
              {msg.text}
            </div>
          );
        })}
      </div>

      {/* Optional Reset Button */}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] flex-shrink-0"
          style={{
            border: "1px solid var(--marble-border)",
            background: "var(--marble-light)",
            color: "var(--text-primary)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "var(--marble-border-strong)";
            (e.currentTarget as HTMLElement).style.background =
              "var(--gold-whisper)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "var(--marble-border)";
            (e.currentTarget as HTMLElement).style.background =
              "var(--marble-light)";
          }}
        >
          <RotateCcw
            className="w-3.5 h-3.5"
            style={{ color: "var(--text-secondary)" }}
          />
          {resetLabel}
        </button>
      )}
    </aside>
  );
}
