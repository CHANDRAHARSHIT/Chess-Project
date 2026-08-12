/**
 * QuickGameView.tsx
 *
 * Renders the Stockfish AI interactive chessboard as a tab view inside the
 * Play Hub. Extracted from QuickGamePage.tsx — all ProductDemo logic is unchanged.
 *
 * Differences from QuickGamePage:
 * - No "Back to Home" button: the hub's tab bar handles in-hub navigation.
 * - No page-level min-h-screen wrapper: the hub provides the outer container.
 */
import ProductDemo from "../ProductDemo";

export function QuickGameView() {
  return (
    <main className="flex-1">
      <ProductDemo />
    </main>
  );
}
