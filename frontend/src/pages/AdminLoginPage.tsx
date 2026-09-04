import React from "react";
import { useNavigate } from "react-router";
import { X } from "lucide-react";

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = () => {
    // Minimal FE transition to admin home page
    navigate("/admin/home");
  };

  const handleClose = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 font-sans relative">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-surface/40 via-brand-bg to-brand-bg pointer-events-none" />

      {/* Login Card matching img1 */}
      <div className="relative w-full max-w-[460px] bg-[#0d1322] border border-[rgba(255,255,255,0.12)] rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl z-10">
        {/* Close Button with rounded border matching img1 */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-11 h-11 rounded-2xl border-2 border-white/80 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 hover:border-white transition-all duration-150 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Header content */}
        <div className="text-center mt-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-sans">
            Sign in using
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-2.5 font-sans">
            Access your dashboard and statistics
          </p>
        </div>

        {/* Continue with Google button matching img1 */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3.5 bg-white text-gray-900 hover:bg-gray-100 font-sans font-semibold text-base py-4 px-6 rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer mb-2"
        >
          {/* Official Google G Logo SVG */}
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
};

export default AdminLoginPage;
