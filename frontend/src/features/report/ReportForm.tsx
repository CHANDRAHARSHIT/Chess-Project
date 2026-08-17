/**
 * ReportForm.tsx (Report section)
 * ScrollTrigger animation: section card fades up + slight scale on enter viewport.
 *
 * Design: Black & Gold premium — obsidian card, gold accents, gold CTA button.
 */

import { useState, useRef } from "react";
import { CheckCircle2, AlertCircle, ShieldAlert, ChevronDown } from "lucide-react";
import { useScrollReveal } from "@/shared/hooks/useScrollReveal";
import { soundManager } from "@/shared/lib/SoundManager";
import rollbar from "@/shared/lib/rollbar";

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function ReportForm() {
  const [email, setEmail] = useState("");
  const [reportType, setReportType] = useState("Cheating / Engine Assistance");
  const [reportedUser, setReportedUser] = useState("");
  const [message, setMessage] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const reportOptions = [
    "Cheating / Engine Assistance",
    "Unsportsmanlike Conduct",
    "Inappropriate Content",
    "Bug / Issue",
    "Other"
  ];

  const [emailError, setEmailError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  const ctaSectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useScrollReveal(cardRef as React.RefObject<Element | null>, {
    y: 50,
    duration: 0.9,
    start: "top 88%",
  });

  const validateEmail = (val: string) => {
    if (!val) return "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      return "Enter a valid email address.";
    return "";
  };

  const validateMessage = (val: string) => {
    if (!val) return "Required";
    if (val.trim().length < 10)
      return "Description must be at least 10 characters.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    const mErr = validateMessage(message);
    setEmailError(eErr);
    setMessageError(mErr);
    if (eErr || mErr) return;

    setStatus("submitting");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
          subject: `New Report Submission: ${reportType}`,
          from_name: "XLChess Reports",
          email: email,
          report_type: reportType,
          reported_user: reportedUser || "N/A",
          message: message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
      } else {
        console.error("Web3Forms Error:", data);
        setStatus("error");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      rollbar.error(err as Error, { context: "ReportForm.handleSubmit" });
      setStatus("error");
    }
  };

  const handleReset = () => {
    setEmail("");
    setReportType("Cheating / Engine Assistance");
    setReportedUser("");
    setMessage("");
    setEmailError("");
    setMessageError("");
    setStatus("idle");
  };

  return (
    <section
      ref={ctaSectionRef}
      id="report-section"
      className="relative z-10 w-full flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 overflow-hidden bg-brand-bg"
    >
      {/* Gold grid background pattern */}
      <div className="contact-page-bg" />

      {/* Gold ambient glows */}
      <div
        className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,110,0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,110,0.06) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div ref={cardRef} className="contact-card" style={{ opacity: 0 }}>
        <div className="relative z-10 max-w-[864px] mx-auto">
          <div className="flex justify-center mb-6">
            <ShieldAlert className="w-12 h-12 text-brand-secondary" />
          </div>
          <h1 className="contact-h2 text-center" style={{ marginBottom: "2rem" }}>Report an Issue</h1>

          {status === "success" ? (
            <div className="max-w-md mx-auto py-8 space-y-6 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{
                  background: "rgba(212, 175, 110, 0.1)",
                  border: "1px solid rgba(212, 175, 110, 0.3)",
                  color: "var(--gold-bright)",
                }}
              >
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3
                  className="font-display font-semibold text-2xl"
                  style={{ color: "var(--text-primary)" }}
                >
                  Report Submitted
                </h3>
                <p
                  className="font-sans leading-relaxed text-base"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Thank you for helping keep our community safe and fair. We will review your report shortly.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm font-medium transition-colors duration-300 text-brand-accent hover:brightness-110"
              >
                Submit another report →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="field font-sans mb-0">
                  <label htmlFor="report-email" className="contact-label">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="report-email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError)
                        setEmailError(validateEmail(e.target.value));
                    }}
                    placeholder="you@example.com"
                    className={`contact-input font-sans ${emailError ? "error" : ""}`}
                  />
                  {emailError && (
                    <p className="text-sm text-red-400 mt-2 font-medium">
                      {emailError}
                    </p>
                  )}
                </div>

                <div className="field font-sans mb-0 relative">
                  <label id="report-type-label" className="contact-label">
                    Report Type
                  </label>
                  <button
                    type="button"
                    aria-labelledby="report-type-label"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="listbox"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`contact-input font-sans w-full flex items-center justify-between bg-brand-bg/50 text-left transition-colors ${isDropdownOpen ? 'border-[var(--gold-bright)]' : ''}`}
                  >
                    <span className="text-brand-text truncate pr-4">{reportType}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 flex-shrink-0 ${isDropdownOpen ? "rotate-180 text-brand-accent" : "text-brand-secondary"}`} />
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute z-50 w-full mt-2 rounded-md bg-brand-bg border border-brand-accent/20 overflow-hidden" style={{ top: '100%', left: 0 }}>
                        <ul className="max-h-60 overflow-auto py-2">
                          {reportOptions.map((option) => (
                            <li key={option}>
                              <button
                                type="button"
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-200 ${reportType === option
                                  ? "bg-brand-accent/15 text-brand-accent font-medium"
                                  : "text-brand-text hover:bg-white/5 hover:text-brand-accent"
                                  }`}
                                onClick={() => {
                                  setReportType(option);
                                  setIsDropdownOpen(false);
                                }}
                              >
                                {option}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="field font-sans">
                <label htmlFor="reported-user" className="contact-label">
                  Reported User (Optional)
                </label>
                <input
                  type="text"
                  id="reported-user"
                  value={reportedUser}
                  onChange={(e) => setReportedUser(e.target.value)}
                  placeholder="Username of the person you are reporting"
                  className="contact-input font-sans"
                />
              </div>

              <div className="field font-sans">
                <label htmlFor="report-message" className="contact-label">
                  Description
                </label>
                <textarea
                  id="report-message"
                  required
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (messageError)
                      setMessageError(validateMessage(e.target.value));
                  }}
                  placeholder="Please provide details about the issue..."
                  className={`contact-textarea font-sans ${messageError ? "error" : ""}`}
                />
                {messageError && (
                  <p className="text-sm text-red-400 mt-2 font-medium">
                    {messageError}
                  </p>
                )}
              </div>

              {status === "error" && (
                <div
                  className="flex items-center gap-2 p-4 rounded-sm text-sm mb-4"
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "rgba(239, 68, 68, 0.9)",
                  }}
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  Something went wrong. Please try again.
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                onClick={() => soundManager.playButtonClick()}
                className="contact-btn btn-glow-container cta-shine group font-sans flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
              >
                {status === "submitting" ? (
                  <>
                    <span className="w-5 h-5 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Report{" "}
                    <img
                      src="/arrow.svg"
                      alt="arrow"
                      className="arrow w-5 h-5 inline-block transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
