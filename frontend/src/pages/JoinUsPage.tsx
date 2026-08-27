import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { soundManager } from "@/shared/lib/SoundManager";
import DepartmentOpeningsTable from "@/features/join-us/DepartmentOpeningsTable";
import DepartmentOpeningsCards from "@/features/join-us/DepartmentOpeningsCards";
import OpeningDetails from "@/features/join-us/OpeningDetails";
import { getOpeningById, type JobOpening } from "@/features/join-us/joinUsData";

export default function JoinUsPage() {
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId?: string }>();

  const selectedOpening = useMemo<JobOpening | null>(() => {
    if (!roleId) return null;
    return getOpeningById(roleId) ?? null;
  }, [roleId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedOpening]);

  const handleSelectOpening = (opening: JobOpening) => {
    navigate(`/join-us/${opening.id}`);
  };

  const handleBackToOpenings = () => {
    navigate("/join-us");
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col pb-16 relative overflow-hidden">
      {/* Background Ambient Glow — continuous across the page */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Banner Section with Smooth Height & Opacity Collapse */}
      <AnimatePresence initial={false}>
        {!selectedOpening && (
          <motion.div
            key="hero-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden relative z-10"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pb-12">
              <div className="mb-6">
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

              <div>
                <h1 className="text-3xl sm:text-5xl font-display font-bold text-brand-text mb-4 leading-tight">
                  Build the Future of <br className="hidden sm:inline" />
                  <span className="text-brand-accent italic">Online Chess</span>
                </h1>

                <div className="w-16 h-0.5 bg-brand-accent mb-6" />

                <p className="text-brand-secondary max-w-2xl text-base sm:text-lg leading-relaxed font-sans">
                  Join our team of passionate developers, marketers, designers, and chess enthusiasts.
                  Help us build the ultimate platform to play, learn, compete, and grow.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4 sm:pt-6 relative z-10">
        <AnimatePresence mode="wait">
          {selectedOpening ? (
            <motion.div
              key={`details-view-${selectedOpening.id}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <OpeningDetails
                opening={selectedOpening}
                onBack={handleBackToOpenings}
              />
            </motion.div>
          ) : (
            <motion.div
              key="openings-view"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-brand-surface rounded-3xl border border-brand-text/15 overflow-hidden backdrop-blur-sm"
            >
              <div className="p-5 sm:p-6 border-b border-brand-text/15 flex items-center space-x-3 bg-brand-surface/60">
                <div className="p-2 rounded-xl bg-brand-accent/10 border border-brand-accent/30">
                  <Briefcase className="text-brand-accent w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-semibold text-brand-text">
                  Current Openings
                </h2>
              </div>

              {/* Desktop Table View */}
              <DepartmentOpeningsTable
                onSelectOpening={handleSelectOpening}
              />

              {/* Mobile Card View */}
              <DepartmentOpeningsCards
                onSelectOpening={handleSelectOpening}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
