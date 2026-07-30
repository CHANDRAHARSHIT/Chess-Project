import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import PartnerCTA from "../components/PartnerCTA";
import { soundManager } from "../utils/SoundManager";

export default function ContactPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Contact Us | XLChess";
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-bg flex flex-col pt-6 pb-12">
      {/* Page-level Header / Navigation Bar (matches PuzzlePage max-w-7xl layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-6 sm:mb-8">
        <button
          type="button"
          onClick={() => {
            soundManager.playButtonClick();
            navigate("/");
          }}
          className="flex items-center gap-2.5 text-xs text-brand-secondary hover:text-brand-text transition-all duration-300 cursor-pointer uppercase tracking-wider font-mono font-medium group"
          aria-label="Back to Home"
        >
          <span className="w-5 h-5 rounded-full border border-brand-border flex items-center justify-center font-bold text-[9px] group-hover:border-brand-accent/50 transition-colors">
            <ArrowLeft className="w-3 h-3" />
          </span>
          Back to Home
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <PartnerCTA />
      </div>
    </div>
  );
}
