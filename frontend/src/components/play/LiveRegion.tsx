/**
 * LiveRegion.tsx
 * The single aria-live announcer for turn changes, check, connection changes, and game-ending
 * events — the moments a sighted player gets from the board instantly (M5 plan §9.3).
 */
interface LiveRegionProps {
  politeMessage: string;
  assertiveMessage: string;
}

export function LiveRegion({ politeMessage, assertiveMessage }: LiveRegionProps) {
  return (
    <>
      <div aria-live="polite" className="sr-only">
        {politeMessage}
      </div>
      <div aria-live="assertive" className="sr-only">
        {assertiveMessage}
      </div>
    </>
  );
}
