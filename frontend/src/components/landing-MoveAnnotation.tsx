import type { ActiveAnnotation } from '@/hooks/landing-useMoveAnnotation';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const BADGE_COLORS: Record<string, string> = {
  '!!': '#22c55e',
  '!': '#3b82f6',
  '!?': '#eab308',
  '?!': '#fb923c',
  '?': '#ef4444',
  '??': '#dc2626',
};

interface MoveAnnotationProps {
  activeAnnotation: ActiveAnnotation | null;
}

export function MoveAnnotation({ activeAnnotation }: MoveAnnotationProps) {
  if (!activeAnnotation) return null;

  const { id, square, badge } = activeAnnotation;
  const fileChar = square[0];
  const rankChar = square[1];

  const fileIdx = FILES.indexOf(fileChar);
  const rankIdx = parseInt(rankChar, 10) - 1;

  if (fileIdx === -1 || isNaN(rankIdx) || rankIdx < 0 || rankIdx > 7) {
    return null;
  }

  const left = `${fileIdx * 12.5}%`;
  const top = `${(7 - rankIdx) * 12.5}%`;
  const backgroundColor = BADGE_COLORS[badge] || '#3b82f6';

  return (
    <div
      key={id}
      style={{
        position: 'absolute',
        left,
        top,
        width: '12.5%',
        height: '12.5%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <style>{`
        @keyframes move-annotation-anim {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.65);
          }
          15% {
            opacity: 1;
            transform: translateY(0px) scale(1.08);
          }
          25% {
            opacity: 1;
            transform: translateY(0px) scale(1.0);
          }
          83.33% {
            opacity: 1;
            transform: translateY(0px) scale(1.0);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px) scale(0.92);
          }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          top: '-18px',
          right: '-10px',
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor,
          boxShadow: '0 0 20px rgba(255,255,255,.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '18px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          animation: 'move-annotation-anim 1200ms cubic-bezier(.22,.61,.36,1) forwards',
          pointerEvents: 'none',
        }}
      >
        {badge}
      </div>
    </div>
  );
}
