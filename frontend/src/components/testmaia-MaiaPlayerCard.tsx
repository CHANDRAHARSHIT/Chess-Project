/**
 * MaiaPlayerCard.tsx
 *
 * Compact player header/footer bar for Maia chess games.
 * Displays avatar, name, rating tag, turn status, captured pieces, and material score advantage.
 */
import { Brain, User, Loader2, AlertCircle } from "lucide-react";
import { type CapturedPieceGroup, getPieceGlyph } from "@/utils/testmaia-maiaHelpers";

interface MaiaPlayerCardProps {
  isBot?: boolean;
  name: string;
  avatarUrl?: string;
  side: "w" | "b";
  elo?: number;
  eloName?: string;
  isTurn: boolean;
  isThinking?: boolean;
  inCheck?: boolean;
  capturedPieces: CapturedPieceGroup[];
  advantage?: number;
  latencyMs?: number | null;
}

export function MaiaPlayerCard({
  isBot = false,
  name,
  avatarUrl,
  side,
  elo,
  eloName,
  isTurn,
  isThinking = false,
  inCheck = false,
  capturedPieces,
  advantage = 0,
  latencyMs,
}: MaiaPlayerCardProps) {
  const isWhite = side === "w";
  // The color of captured pieces is opposite to this player's side
  const capturedPieceColor = isWhite ? "b" : "w";

  return (
    <div
      className={`flex items-center justify-between gap-2.5 rounded-xl border px-3 py-1.5 h-[48px] backdrop-blur-md transition-all duration-200 ${
        isTurn
          ? "bg-brand-surface/90 border-brand-accent/50 ring-1 ring-brand-accent/30"
          : "bg-brand-surface/50 border-white/10 opacity-90"
      }`}
    >
      {/* Left: Avatar & Identity */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center border overflow-hidden transition-all ${
              isBot
                ? "bg-brand-accent/15 border-brand-accent/30 text-brand-accent"
                : "bg-brand-bg/80 border-white/15 text-brand-text"
            }`}
          >
            {isBot ? (
              <Brain className={`w-4 h-4 ${isThinking ? "animate-pulse text-brand-accent" : ""}`} />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5 text-brand-secondary" />
            )}
          </div>

          {/* Turn dot */}
          {isTurn && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isBot ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isBot ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
            </span>
          )}
        </div>

        {/* Name, Side & Captured Pieces */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-sans text-xs font-bold text-brand-text truncate">
              {name}
            </span>

            {/* Elo or Bot Badge */}
            {isBot && elo && (
              <span className="shrink-0 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-brand-accent/20 border border-brand-accent/35 text-brand-accent uppercase tracking-wider">
                {eloName ?? "Maia"} • {elo}
              </span>
            )}

            {!isBot && (
              <span className="shrink-0 px-1.5 py-0.2 rounded font-mono text-[9px] text-brand-secondary bg-white/5 border border-white/10 uppercase">
                {isWhite ? "White" : "Black"}
              </span>
            )}
          </div>

          {/* Captured Pieces & Material Score */}
          <div className="flex items-center gap-1 mt-0.5 text-[10px] font-mono text-brand-secondary leading-none">
            <div className="flex items-center gap-0.5 overflow-hidden">
              {capturedPieces.map((group) => {
                const glyph = getPieceGlyph(group.piece, capturedPieceColor);
                return (
                  <span key={group.piece} className="text-brand-text/80 text-[11px] leading-none">
                    {glyph}
                    {group.count > 1 ? (
                      <span className="text-[8px] text-brand-secondary font-mono mr-0.5">
                        ×{group.count}
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </div>

            {advantage > 0 && (
              <span className="font-bold text-[9px] text-brand-accent bg-brand-accent/10 px-1 rounded border border-brand-accent/20 leading-tight">
                +{advantage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Turn Status & Inference Latency */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isThinking ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
            <span>Thinking…</span>
          </span>
        ) : inCheck ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider font-extrabold bg-rose-500/20 border border-rose-500/40 text-rose-300">
            <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
            <span>Check</span>
          </span>
        ) : isTurn ? (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider font-bold ${
              isBot
                ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isBot ? "bg-amber-400" : "bg-emerald-400"}`}
            />
            <span>{isBot ? "Maia's Turn" : "Your Turn"}</span>
          </span>
        ) : null}

        {isBot && latencyMs && !isThinking && (
          <span className="hidden sm:inline font-mono text-[9px] text-brand-secondary/60">
            {latencyMs}ms
          </span>
        )}
      </div>
    </div>
  );
}
