/**
 * QuickGameView.tsx
 *
 * Renders the Stockfish AI interactive chessboard as a tab view inside the
 * Play Hub. Extracted from QuickGamePage.tsx — all QuickGameBoard logic is unchanged.
 *
 * Differences from QuickGamePage:
 * - No "Back to Home" button: the hub's tab bar handles in-hub navigation.
 * - No page-level min-h-screen wrapper: the hub provides the outer container.
 */
import QuickGameBoard from "./QuickGameBoard";

export function QuickGameView() {
  return (
    <main className="flex-1">
      <QuickGameBoard />
    </main>
  );
}
