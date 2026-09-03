import { useNavigate } from "react-router";
import { getAssessmentTrackSlug, type JobOpening } from "./joinUsData";
import { soundManager } from "@/shared/lib/SoundManager";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ROUTES } from "@/app/router/routes.config";

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
    const trackSlug = getAssessmentTrackSlug(opening.department);
    navigate(
      ROUTES.JOIN_ASSESSMENT_ROLE(trackSlug ?? opening.department.toLowerCase()),
    );
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
          <div className="mb-8 pb-8 border-b border-brand-text/15">
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-brand-text tracking-tight">
              {opening.title}
            </h1>
            <p className="text-brand-accent font-medium text-sm sm:text-base mt-1 font-mono uppercase tracking-wider">
              {opening.department}
            </p>
          </div>

          {/* Overview Content */}
          <div className="space-y-4 text-brand-secondary text-base sm:text-lg leading-relaxed">
            {opening.overview.split("\n\n").map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          <div className="my-8 w-full h-px bg-brand-text/10" />

          {/* Role details Section */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text">
              Role details
            </h2>
            <div className="bg-brand-surface/60 rounded-2xl border border-brand-text/15 p-5 sm:p-6 space-y-3">
              {opening.roleDetails?.location && (
                <div className="flex items-center gap-3 text-sm sm:text-base text-brand-text">
                  <div className="w-2 h-2 rounded-full bg-brand-accent shrink-0" />
                  <span>{opening.roleDetails.location}</span>
                </div>
              )}
              {opening.roleDetails?.hours && (
                <div className="flex items-center gap-3 text-sm sm:text-base text-brand-text">
                  <div className="w-2 h-2 rounded-full bg-brand-accent shrink-0" />
                  <span>{opening.roleDetails.hours}</span>
                </div>
              )}
              {opening.roleDetails?.employmentType && (
                <div className="flex items-center gap-3 text-sm sm:text-base text-brand-text">
                  <div className="w-2 h-2 rounded-full bg-brand-accent shrink-0" />
                  <span>
                    <strong className="font-semibold">Employment type:</strong> {opening.roleDetails.employmentType}
                  </span>
                </div>
              )}
              {opening.roleDetails?.salaryNotice && (
                <div className="flex items-center gap-3 text-sm sm:text-base text-brand-text">
                  <div className="w-2 h-2 rounded-full bg-brand-accent shrink-0" />
                  <span>{opening.roleDetails.salaryNotice}</span>
                </div>
              )}
            </div>
          </div>

          <div className="my-8 w-full h-px bg-brand-text/10" />

          {/* Assessment details Section */}
          <div className="space-y-4 mb-10">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text">
              Assessment details
            </h2>
            <div className="bg-brand-surface/60 rounded-2xl border border-brand-text/15 p-5 sm:p-6 space-y-3 font-sans">
              {opening.assessmentDetails?.estimatedTime && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-brand-text/10 gap-1">
                  <span className="text-sm text-brand-secondary">Estimated time to complete</span>
                  <span className="text-sm sm:text-base font-semibold text-brand-text">
                    {opening.assessmentDetails.estimatedTime}
                  </span>
                </div>
              )}
              {opening.assessmentDetails?.numberOfQuestions != null && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-brand-text/10 gap-1">
                  <span className="text-sm text-brand-secondary">Number of questions</span>
                  <span className="text-sm sm:text-base font-semibold text-brand-text">
                    {opening.assessmentDetails.numberOfQuestions}
                  </span>
                </div>
              )}
              {opening.assessmentDetails?.aiAssistance && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-brand-text/10 gap-1">
                  <span className="text-sm text-brand-secondary">AI assistance</span>
                  <span className="text-sm sm:text-base font-semibold text-red-400">
                    {opening.assessmentDetails.aiAssistance}
                  </span>
                </div>
              )}
              {opening.assessmentDetails?.timeLimit && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-brand-text/10 gap-1">
                  <span className="text-sm text-brand-secondary">Time limit</span>
                  <span className="text-sm sm:text-base font-semibold text-brand-text">
                    {opening.assessmentDetails.timeLimit}
                  </span>
                </div>
              )}
              {opening.assessmentDetails?.maximumAttempts != null && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-brand-text/10 gap-1">
                  <span className="text-sm text-brand-secondary">Maximum attempts</span>
                  <span className="text-sm sm:text-base font-semibold text-brand-text">
                    {opening.assessmentDetails.maximumAttempts}
                  </span>
                </div>
              )}
              {opening.assessmentDetails?.nextStep && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-1">
                  <span className="text-sm text-brand-secondary">Next step</span>
                  <span className="text-sm sm:text-base font-semibold text-brand-accent">
                    {opening.assessmentDetails.nextStep}
                  </span>
                </div>
              )}
            </div>
          </div>

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
