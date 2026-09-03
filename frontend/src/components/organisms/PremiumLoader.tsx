import React, { useEffect, useState } from "react";

export interface PremiumLoaderProps {
  progress?: number;
  label?: string;
  isExiting?: boolean;
}

export const PremiumLoader: React.FC<PremiumLoaderProps> = ({
  progress = 100,
  label = "Initializing Arena",
  isExiting = false,
}) => {
  const [currentProgress, setCurrentProgress] = useState(progress);

  useEffect(() => {
    setCurrentProgress(progress);
  }, [progress]);

  return (
    <div
      className={`premium-loader ${isExiting ? "exiting" : ""}`}
      aria-label="Loading Application"
      role="progressbar"
      aria-valuenow={currentProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="premium-loader__bg" />
      <div className="loader-rook-container">
        <svg
          className="loader-rook-svg"
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="rook-silhouette"
            d="M20 105h60v5H20v-5zm4-8h52v4H24v-4zm6-6h40v2H30v-2zm4-40h32v36H34V51zm-8-12h48v8H26v-8zm-6-15h60v11H20V24zm4-12h10v8H24v-8zm19 0h14v8H43v-8zm24 0h9v8h-9v-8z"
          />
          <path
            className="rook-wireframe"
            d="M25 105L30 55h40l5 50H25zm5-50l-4-15h48l-4 15H30z"
          />
        </svg>
      </div>
      <div className="loader-progress-track">
        <div
          className="loader-progress-fill"
          style={{ width: `${currentProgress}%` }}
        />
      </div>
      {label && <div className="loader-label">{label}</div>}
    </div>
  );
};

export default PremiumLoader;
