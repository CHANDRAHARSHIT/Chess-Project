import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { X, Sun, Moon, ShieldCheck, Lock } from "lucide-react";
import { adminSignIn } from "@/features/admin/adminAuth";
import { useTheme } from "@/shared/appearance/useTheme";

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { themeMode, setThemeModeId } = useTheme();

  // Auth.js redirects here with ?error=AccessDenied when the Google account is
  // not a registered admin.
  const error = searchParams.get("error");

  const handleGoogleSignIn = () => {
    setIsSigningIn(true);
    adminSignIn("/admin/home").catch(() => setIsSigningIn(false));
  };

  const handleClose = () => {
    navigate("/");
  };

  const toggleTheme = () => {
    setThemeModeId(themeMode.id === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-200">
      {/* Background ambient lighting & radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-surface/40 via-brand-bg to-brand-bg pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar with Theme Switcher */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${themeMode.id === "dark" ? "light" : "dark"} mode`}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-brand-border bg-brand-surface/80 hover:bg-brand-surface text-brand-secondary hover:text-brand-text transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
        >
          {themeMode.id === "dark" ? (
            <Sun className="w-4 h-4 text-brand-accent" />
          ) : (
            <Moon className="w-4 h-4 text-brand-accent" />
          )}
        </button>
      </div>

      {/* Login Card matching img1 with luxury double-border and refined typography */}
      <div className="relative w-full max-w-[460px] bg-brand-surface/95 border border-brand-border rounded-3xl p-8 sm:p-10 backdrop-blur-2xl ring-1 ring-white/5 transition-colors duration-200 z-10">
        {/* Close Button with rounded border matching img1 */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-11 h-11 rounded-2xl border-2 border-brand-border/60 hover:border-brand-accent flex items-center justify-center text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 active:scale-95 transition-all duration-150 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Header content */}
        <div className="text-center mt-4 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-bg/80 border border-brand-border/60 mb-4 text-brand-accent">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-text tracking-tight font-sans">
            Sign in using
          </h1>
          <p className="text-sm sm:text-base text-brand-secondary mt-2.5 font-sans">
            Access your dashboard and statistics
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-300 font-sans animate-in fade-in duration-200"
          >
            {error === "AccessDenied"
              ? "That Google account is not an XLChess admin."
              : "Sign-in failed. Please try again."}
          </div>
        )}

        {/* Continue with Google button matching img1 with tactile physics */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-3.5 bg-white text-gray-900 hover:bg-gray-50 border border-gray-200/80 hover:border-brand-accent/50 disabled:opacity-60 disabled:cursor-not-allowed font-sans font-semibold text-base py-4 px-6 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer mb-6 group"
        >
          {/* Official Google G Logo SVG */}
          <svg className="w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <span>{isSigningIn ? "Redirecting…" : "Continue with Google"}</span>
        </button>

        {/* Security / Authorization Footer */}
        <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-brand-border/40 text-xs text-brand-secondary font-sans select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-accent shrink-0" />
          <span>Authorized Personnel Only • Secure OAuth 2.0</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
