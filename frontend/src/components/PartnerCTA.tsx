/**
 * PartnerCTA.tsx  (Contact / Partner section)
 * ScrollTrigger animation: section card fades up + slight scale on enter viewport.
 *
 * Design: Black & Gold premium — obsidian card, gold accents, gold CTA button.
 */

import { useState, useRef } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { soundManager } from "../utils/SoundManager";

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function ContactSection() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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
      return "Message must be at least 10 characters.";
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
          access_key: "c47b4f02-f2e3-431d-b3e8-7de73e8e7d45",
          subject: "New Contact Form Submission",
          from_name: "ChessCraft Website",
          email: email,
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
      setStatus("error");
    }
  };

  const handleReset = () => {
    setEmail("");
    setMessage("");
    setEmailError("");
    setMessageError("");
    setStatus("idle");
  };

  return (
    <section
      ref={ctaSectionRef}
      id="contact-us"
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
          <h1 className="contact-h2">Contact Us</h1>

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
                  Message Sent
                </h3>
                <p
                  className="font-sans leading-relaxed text-base"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Thank you for reaching out. Your message has been sent
                  successfully. We'll get back to you as soon as possible.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm font-medium transition-colors duration-300 text-brand-accent hover:brightness-110"
              >
                Send another message →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="field font-sans">
                <label htmlFor="contact-email" className="contact-label">
                  Email
                </label>
                <input
                  type="email"
                  id="contact-email"
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

              <div className="field font-sans">
                <label htmlFor="contact-message" className="contact-label">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (messageError)
                      setMessageError(validateMessage(e.target.value));
                  }}
                  placeholder="Tell us how we can help you."
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
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                onClick={() => soundManager.playButtonClick()}
                className="contact-btn font-sans flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
              >
                {status === "submitting" ? (
                  <>
                    <span className="w-5 h-5 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message{" "}
                    <img
                      src="/arrow.svg"
                      alt="arrow"
                      className="arrow w-7 h-7 inline-block"
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
