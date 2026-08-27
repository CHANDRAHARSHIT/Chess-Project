import { useNavigate } from "react-router";
import { type JobOpening } from "./joinUsData";
import { soundManager } from "@/shared/lib/SoundManager";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Server,
} from "lucide-react";

interface OpeningDetailsProps {
  opening: JobOpening;
  onBack: () => void;
}

export default function OpeningDetails({
  opening,
  onBack,
}: OpeningDetailsProps) {
  const navigate = useNavigate();

  const handleBeginAssessment = () => {
    soundManager.playButtonClick();
    navigate(`/join-us/${opening.id}/assessment`);
  };

  const getDepartmentIcon = () => {
    switch (opening.department) {
      case "Growth & Marketing":
        return <TrendingUp className="text-brand-accent w-7 h-7" />;
      case "Backend":
        return <Server className="text-brand-accent w-7 h-7" />;
      default:
        return <Briefcase className="text-brand-accent w-7 h-7" />;
    }
  };

  return (
    <div className="font-sans">
      {/* Back to Openings Button */}
      <button
        type="button"
        onClick={() => {
          soundManager.playButtonClick();
          onBack();
        }}
        className="mb-6 inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 text-sm font-semibold cursor-pointer group"
        aria-label="Back to Openings"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Openings</span>
      </button>

      {/* Main Details Card */}
      <div className="bg-brand-surface rounded-3xl p-6 sm:p-10 md:p-12 border border-brand-text/15 relative overflow-hidden backdrop-blur-sm">
        {/* Subtle gold decorative backdrop blur */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-accent/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          {/* Header Title Block */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pb-8 border-b border-brand-text/15">
            <div className="p-3.5 bg-brand-accent/10 border border-brand-accent/30 rounded-2xl shrink-0 w-fit">
              {getDepartmentIcon()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-brand-text tracking-tight">
                {opening.title}
              </h1>
              {opening.roleSubtitle && (
                <p className="text-brand-accent font-medium text-sm sm:text-base mt-0.5">
                  {opening.roleSubtitle}
                </p>
              )}
            </div>
          </div>

          {/* Overview Content */}
          <div className="space-y-4 text-brand-secondary text-base sm:text-lg leading-relaxed">
            {opening.overview.split("\n\n").map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}

            {opening.evaluationDetails && (
              <div className="bg-brand-surface/60 p-5 sm:p-6 rounded-2xl border border-brand-text/15 flex gap-4 mt-6">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-1 w-6 h-6" />
                <div>
                  <h3 className="text-brand-text font-semibold text-base mb-1">
                    {opening.evaluationTitle || "What We Evaluate"}
                  </h3>
                  <p className="text-brand-secondary text-sm leading-relaxed">
                    {opening.evaluationDetails}
                  </p>
                </div>
              </div>
            )}
          </div>

          {opening.rules && opening.rules.length > 0 && (
            <>
              <div className="my-10 w-full h-px bg-brand-text/10" />

              <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text flex items-center gap-3">
                  <AlertCircle className="text-amber-500 dark:text-amber-400 w-6 h-6 shrink-0" />
                  <span>{opening.rulesHeading || "Before You Begin"}</span>
                </h2>

                {opening.rulesSubheading && (
                  <p className="text-brand-secondary text-base sm:text-lg leading-relaxed">
                    {opening.rulesSubheading}
                  </p>
                )}

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 sm:p-6">
                  <p className="mb-4 font-semibold text-amber-600 dark:text-amber-400 text-sm sm:text-base">
                    During this section:
                  </p>
                  <ul className="space-y-3">
                    {opening.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mt-2.5 shrink-0" />
                        <span className="text-brand-text text-sm sm:text-base">
                          {rule}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {opening.rulesFootnote && (
                  <p className="text-brand-secondary/70 italic text-xs sm:text-sm">
                    {opening.rulesFootnote}
                  </p>
                )}
              </div>
            </>
          )}

          {opening.timeRequirement && (
            <>
              <div className="my-10 w-full h-px border-t border-brand-text/10" />

              <div className="flex items-start gap-4 mb-10">
                <div className="p-3 bg-brand-accent/10 rounded-2xl border border-brand-accent/30 shrink-0">
                  <Clock className="text-brand-accent w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text mb-2">
                    Time Requirement
                  </h2>
                  <p className="text-brand-secondary text-base sm:text-lg leading-relaxed">
                    {opening.timeRequirement}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* CTA Action Area */}
          <div className="pt-4 flex justify-center sm:justify-start">
            <button
              type="button"
              onClick={handleBeginAssessment}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-brand-bg transition-all duration-200 bg-brand-accent border border-brand-accent rounded-2xl hover:bg-brand-accent/90 hover:scale-[1.02] active:scale-95 focus:outline-none w-full sm:w-auto cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2 text-base font-semibold">
                <span>{opening.ctaText || "Begin Assessment"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
