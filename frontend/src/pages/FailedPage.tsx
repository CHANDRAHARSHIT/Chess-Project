import { useEffect, useState } from "react";
import { ArrowRight, AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { useNavigate } from "react-router";

export default function FailedPage() {
  const navigate = useNavigate();
  const [errorReason, setErrorReason] = useState<string>(
    "Payment cancelled or declined.",
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    if (reason) {
      setErrorReason(reason);
    }
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative overflow-hidden select-none pb-16">
      {/* Ambient background glows */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[900px] h-[400px] bg-rose-500/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Page Header */}
      <header className="relative z-10 w-full bg-brand-bg/80 backdrop-blur-md border-b border-brand-border px-4 py-4 sm:py-5 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-center">
          <img
            src="/final%20logo.png"
            alt="XLChess logo"
            className="h-[36px] w-auto object-contain cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
      </header>

      {/* Main content wrapper */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-4 py-12 w-full text-center">
        {/* Failed Icon Block */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl scale-125 animate-pulse" />

          <div className="w-20 h-20 rounded-full bg-brand-bg border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto relative z-10">
            <XCircle className="w-10 h-10" />
          </div>
        </div>

        {/* Header Text */}
        <h1 className="text-3xl font-display font-medium text-brand-text tracking-wide mb-3 leading-tight">
          Payment Unsuccessful
        </h1>

        <p className="text-sm text-brand-secondary font-sans leading-relaxed mb-8 max-w-sm">
          Your checkout session was cancelled or could not be processed. No
          charges were made to your card.
        </p>

        {/* Reason Card */}
        <div className="w-full bg-brand-surface/60 backdrop-blur-xl border border-brand-border rounded-2xl p-5 mb-8 text-left relative overflow-hidden">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block mb-0.5">
                Status Reason
              </span>
              <span className="text-sm font-sans text-brand-text leading-relaxed">
                {errorReason}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4">
          <button
            onClick={() => navigate("/pricing")}
            className="w-full py-4 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold bg-brand-text/5 border border-white/10 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full py-4 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-bold btn-premium-cta btn-glow-container btn-glow-accent cta-shine cursor-pointer hover:scale-[1.01] flex items-center justify-center gap-2"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
