/**
 * QuickGamePage.tsx
 * Quick Game page rendering the central interactive chessboard with Stockfish AI.
 */

import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import ProductDemo from "../components/ProductDemo";
import { soundManager } from "../utils/SoundManager";

export default function QuickGamePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-brand-text flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4 sm:pt-6">
        <button
          type="button"
          onClick={() => {
            soundManager.playButtonClick();
            navigate("/");
          }}
          className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </button>
      </div>
      <main className="flex-1">
        <ProductDemo />
      </main>
    </div>
  );
}
