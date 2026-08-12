import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import PartnerCTA from "@/components/PartnerCTA";
import { soundManager } from "@/shared/lib/SoundManager";

export default function ContactPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
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
          className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <PartnerCTA />
      </div>
    </div>
  );
}
