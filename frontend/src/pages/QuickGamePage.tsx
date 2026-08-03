/**
 * QuickGamePage.tsx
 * Quick Game page rendering the central interactive chessboard with Stockfish AI.
 */

import ProductDemo from "../components/ProductDemo";

export default function QuickGamePage() {
  return (
    <div className="min-h-screen text-brand-text flex flex-col">
      <main className="flex-1">
        <ProductDemo />
      </main>
    </div>
  );
}
