/**
 * OpponentIdentity.tsx
 * A deterministic, honest pseudonym — the backend has no public user-lookup endpoint (M5 plan
 * §0 B8), so this never fabricates a name. A crest generated from a hash of the userId, split
 * across the player's own board theme colors, stands in for an avatar.
 */
import { useBoardSettings } from "../../hooks/useBoardSettings";

function hashUserId(userId: string): number {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface OpponentIdentityProps {
  userId: string;
  label: string;
  size?: number;
}

export function OpponentIdentity({ userId, label, size = 36 }: OpponentIdentityProps) {
  const { boardTheme } = useBoardSettings();
  const hash = hashUserId(userId);
  const rotation = (hash % 4) * 90;

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="shrink-0 rounded-full overflow-hidden border border-brand-border/60 relative flex items-center justify-center"
        style={{ width: size, height: size, background: boardTheme.dark }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${rotation}deg, ${boardTheme.light} 50%, ${boardTheme.dark} 50%)`,
          }}
        />
        <svg
          className="relative text-brand-accent drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
          style={{ width: size * 0.55, height: size * 0.55 }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19 22H5v-2h14v2zm-2-4H7v-2h10v2zm-1.8-6.2c.4-.7.8-1.5 1-2.4.2-1.1.1-2.1-.3-3.1-.4-1-1.1-1.7-2.1-2.1-.8-.3-1.6-.3-2.5-.1-.3-1.2-1.1-2.2-2.2-2.7C8 1 6.8 1.2 5.8 1.9c-1 .7-1.6 1.7-1.7 2.9-.1 1.2.3 2.3 1.1 3.2l.6.6v.9H4v2h2v.9l.6.6c.4.4.9.7 1.4.9v2.2h8v-3.9zM8.5 7.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5z" />
        </svg>
      </div>
      <span className="font-sans text-sm font-semibold text-brand-text truncate tracking-tight">{label}</span>
    </div>
  );
}
