import { useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function PartnerCTA() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    type: 'coach',
    audienceSize: '1-100',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email) return;

    setIsSubmitting(true);
    // Mock API delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1200);
  };

  return (
    <section id="partner-cta" className="py-20 md:py-28 bg-brand-surface relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-brand-bg border border-brand-border rounded-2xl shadow-2xl p-8 sm:p-12 text-center space-y-8 relative overflow-hidden">
          
          {/* Top border glow effect */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-accent/60 to-transparent" />

          {/* Form Header */}
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
              Looking For Creator Partners
            </h2>
            <p className="font-sans text-brand-secondary text-sm leading-relaxed">
              We are currently accepting a limited cohort of academies and creators for our early access program. 
              Get direct engineering support to build and launch your portal.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="text-left max-w-lg mx-auto space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label htmlFor="name" className="text-xs font-medium text-brand-secondary">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({...formState, name: e.target.value})}
                    placeholder="Grandmaster Chess"
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-brand-secondary/40 focus:outline-none focus:border-brand-accent/70 transition-all font-sans"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="email" className="text-xs font-medium text-brand-secondary">Work Email</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({...formState, email: e.target.value})}
                    placeholder="gm@academy.com"
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-brand-secondary/40 focus:outline-none focus:border-brand-accent/70 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Type Selection */}
                <div className="space-y-1">
                  <label htmlFor="type" className="text-xs font-medium text-brand-secondary">Creator Profile</label>
                  <select
                    id="type"
                    value={formState.type}
                    onChange={(e) => setFormState({...formState, type: e.target.value})}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-accent/70 transition-all font-sans"
                  >
                    <option value="coach">Chess Coach / Instructor</option>
                    <option value="youtuber">Streamer / Content Creator</option>
                    <option value="academy">Chess Academy / Club</option>
                    <option value="other">Other Chess Business</option>
                  </select>
                </div>

                {/* Audience Size */}
                <div className="space-y-1">
                  <label htmlFor="audience" className="text-xs font-medium text-brand-secondary">Active Students / Audience Size</label>
                  <select
                    id="audience"
                    value={formState.audienceSize}
                    onChange={(e) => setFormState({...formState, audienceSize: e.target.value})}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-accent/70 transition-all font-sans"
                  >
                    <option value="1-50">1 - 50 members</option>
                    <option value="51-500">51 - 500 members</option>
                    <option value="501-5000">501 - 5,000 members</option>
                    <option value="5000+">5,000+ members</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label htmlFor="message" className="text-xs font-medium text-brand-secondary">Notes (Optional)</label>
                <textarea
                  id="message"
                  rows={3}
                  value={formState.message}
                  onChange={(e) => setFormState({...formState, message: e.target.value})}
                  placeholder="Tell us about your brand..."
                  className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-brand-secondary/40 focus:outline-none focus:border-brand-accent/70 transition-all font-sans resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 font-sans font-semibold text-sm bg-brand-accent hover:bg-brand-accent/95 text-white py-3.5 rounded-lg transition-all duration-200 shadow-lg shadow-brand-accent/20 disabled:opacity-75 disabled:pointer-events-none mt-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scheduling Demo...
                  </>
                ) : (
                  <>
                    Book a Demo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="max-w-md mx-auto py-8 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-sans font-bold text-xl text-white">Inquiry Received</h3>
                <p className="font-sans text-sm text-brand-secondary leading-relaxed">
                  Thank you for reaching out, <span className="text-white font-medium">{formState.name}</span>. 
                  Our founding engineering team will contact you at <span className="text-white font-medium">{formState.email}</span> within 24 hours to schedule your custom domain onboarding.
                </p>
              </div>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-xs text-brand-accent font-semibold hover:underline"
              >
                Submit another inquiry
              </button>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
