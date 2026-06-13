/**
 * PartnerCTA.tsx  (Contact / Partner section)
 * ScrollTrigger animation: section card fades up + slight scale on enter viewport.
 */

import { useState, useRef } from 'react';
import { CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

// Read recipient from environment — never hardcoded
const RECIPIENT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactSection() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');

  // ScrollTrigger reveal for the section card
  const cardRef = useRef<HTMLDivElement>(null);
  useScrollReveal(cardRef as React.RefObject<Element | null>, {
    y: 50,
    duration: 0.9,
    start: 'top 88%',
  });

  const validateEmail = (val: string) => {
    if (!val) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address.';
    return '';
  };

  const validateMessage = (val: string) => {
    if (!val) return 'Message is required.';
    if (val.trim().length < 10) return 'Message must be at least 10 characters.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    const mErr = validateMessage(message);
    setEmailError(eErr);
    setMessageError(mErr);
    if (eErr || mErr) return;

    setStatus('submitting');

    try {
      // Using mailto: as the submission mechanism since no backend exists in this demo.
      // In production, replace with a real API endpoint (e.g. /api/contact).
      const recipient = RECIPIENT_EMAIL || 'contact@xlchess.com';
      const subject = encodeURIComponent('ChessCraft Contact Form');
      const body = encodeURIComponent(`From: ${email}\n\n${message}`);
      const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;

      // Open native mail client
      window.location.href = mailtoLink;

      // Slight delay so mailto fires before state update
      await new Promise((r) => setTimeout(r, 600));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const handleReset = () => {
    setEmail('');
    setMessage('');
    setEmailError('');
    setMessageError('');
    setStatus('idle');
  };

  return (
    <section id="partner-cta" className="py-20 md:py-28 bg-brand-surface relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ref attached here — ScrollTrigger fades this card up on enter */}
        <div
          ref={cardRef}
          className="bg-brand-bg border border-brand-border rounded-2xl shadow-2xl p-8 sm:p-12 text-center space-y-8 relative overflow-hidden"
          style={{ opacity: 0 }}
        >

          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-accent/60 to-transparent" />

          {/* Heading */}
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
              Contact Us
            </h2>
          </div>

          {status === 'success' ? (
            <div className="max-w-md mx-auto py-8 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-sans font-bold text-xl text-white">Message Sent</h3>
                <p className="font-sans text-sm text-brand-secondary leading-relaxed">
                  Thank you for reaching out. Your default mail client has been opened with your message pre-filled.
                  We'll get back to you as soon as possible.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-brand-accent font-semibold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="text-left max-w-lg mx-auto space-y-5">

              {/* Email field */}
              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="text-xs font-medium text-brand-secondary">
                  Email <span className="text-brand-accent">*</span>
                </label>
                <input
                  type="email"
                  id="contact-email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(validateEmail(e.target.value));
                  }}
                  placeholder="you@example.com"
                  className={`w-full bg-brand-surface border rounded-lg px-4 py-2.5 text-sm text-white placeholder-brand-secondary/40 focus:outline-none transition-all font-sans ${
                    emailError
                      ? 'border-red-500/70 focus:border-red-500'
                      : 'border-brand-border focus:border-brand-accent/70'
                  }`}
                />
                {emailError && (
                  <p className="text-xs text-red-400 mt-1">{emailError}</p>
                )}
              </div>

              {/* Message field */}
              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="text-xs font-medium text-brand-secondary">
                  Message <span className="text-brand-accent">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (messageError) setMessageError(validateMessage(e.target.value));
                  }}
                  placeholder="Tell us how we can help you..."
                  className={`w-full bg-brand-surface border rounded-lg px-4 py-2.5 text-sm text-white placeholder-brand-secondary/40 focus:outline-none transition-all font-sans resize-none ${
                    messageError
                      ? 'border-red-500/70 focus:border-red-500'
                      : 'border-brand-border focus:border-brand-accent/70'
                  }`}
                />
                <div className="flex items-start justify-between gap-2">
                  {messageError ? (
                    <p className="text-xs text-red-400">{messageError}</p>
                  ) : (
                    <span />
                  )}
                  <span className={`text-[10px] shrink-0 ${message.length < 10 ? 'text-brand-secondary/50' : 'text-green-500/70'}`}>
                    {message.length} / 10 min
                  </span>
                </div>
              </div>

              {/* Error state */}
              {status === 'error' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full flex items-center justify-center gap-2 font-sans font-semibold text-sm bg-brand-accent hover:bg-brand-accent/95 text-white py-3.5 rounded-lg transition-all duration-200 shadow-lg shadow-brand-accent/20 disabled:opacity-75 disabled:pointer-events-none"
              >
                {status === 'submitting' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Submit
                    <ArrowRight className="w-4 h-4" />
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
