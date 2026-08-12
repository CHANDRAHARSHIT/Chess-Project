import { useEffect, useState } from "react";
import { ArrowRight, Mail, Check, Award } from "lucide-react";
import { useNavigate } from "react-router";
import { Confetti } from "@/components/Confetti";
import { useSession } from "@/hooks/useSession";
import { PaymentService } from "@/services/payment";
import rollbar from "@/config/rollbar";

interface UpgradeDetails {
  billingCycle: "Monthly" | "Yearly";
  purchaseDate: string;
  txnId: string;
  selectedPlan: string;
  totalPaid: string;
  renewalDate: string;
  username: string;
  email: string;
  currency: string;
  discount: string;
}

export default function SuccessfulPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [details, setDetails] = useState<UpgradeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (sessionId) {
      let attempts = 0;
      const maxAttempts = 15; // 30 seconds max

      const checkSession = async () => {
        try {
          const res = await PaymentService.getCheckoutSession(sessionId);
          if (res.status === "success" && res.data) {
            const data = res.data;

            if (data.isSubscribed && data.subscription) {
              const stripeSession = data.session;
              const upgradeDetails: UpgradeDetails = {
                billingCycle:
                  data.subscription.billingInterval === "year"
                    ? "Yearly"
                    : "Monthly",
                purchaseDate: new Date().toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
                txnId: stripeSession?.id || "",
                selectedPlan: data.subscription.productName || "Pro Plan",
                // Use pre-formatted amount from Stripe metadata (e.g. "₹483", "$5", "NZ$9")
                totalPaid: stripeSession?.totalPaidFormatted || "Processing...",
                renewalDate: data.subscription.currentPeriodEnd
                  ? new Date(
                      data.subscription.currentPeriodEnd,
                    ).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Pending Verification",
                username: session?.user?.name || "Grandmaster",
                email:
                  stripeSession?.customerEmail || session?.user?.email || "",
                // Currency code from Stripe session (e.g. "INR", "USD", "NZD")
                currency: stripeSession?.currency || "NZD",
                // Discount formatted with correct symbol
                discount: `${stripeSession?.symbol || ""}0.00`,
              };
              setDetails(upgradeDetails);
              setLoading(false);
              return true;
            }
          }
        } catch (err) {
          console.error("Error fetching checkout status:", err);
          // Retried by the poll loop below, so this never reaches the
          // ErrorBoundary — report it manually since it's a payment-confirmation path.
          rollbar.error(err as Error, {
            context: "SuccessfulPage.pollCheckoutStatus",
          });
        }
        return false;
      };

      const poll = async () => {
        const success = await checkSession();
        if (success) return;

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Check every 2 seconds
        } else {
          setDetails({
            billingCycle: "Monthly",
            purchaseDate: new Date().toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            txnId: sessionId,
            selectedPlan: "Premium Membership",
            totalPaid: "Processing...",
            renewalDate: "Pending Verification",
            username: session?.user?.name || "Member",
            email: session?.user?.email || "",
            currency: "NZD",
            discount: "NZ$0.00",
          });
          setLoading(false);
        }
      };

      poll();
      return;
    }

    // Verify payment completion flags (both sessionStorage and in-memory window flag)
    const isCompleted =
      sessionStorage.getItem("xlchess_payment_completed") === "true" ||
      (window as unknown as Record<string, unknown>).xlchess_payment_completed === true;
    const stored = sessionStorage.getItem("xlchess_upgrade_success_data");

    if (!isCompleted || !stored) {
      navigate("/pricing?error=payment_expired");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as UpgradeDetails;
      setDetails(parsed);
    } catch (e) {
      // A completed payment can't render its success details here, so
      // report it manually — the customer sees "payment expired" despite paying.
      rollbar.error(e as Error, {
        context: "SuccessfulPage.parseUpgradeDetails",
      });
      navigate("/pricing?error=payment_expired");
    } finally {
      setLoading(false);
    }

    return () => {
      // Clean up payment status on navigate away (unmount)
      try {
        sessionStorage.removeItem("xlchess_payment_completed");
        sessionStorage.removeItem("xlchess_upgrade_success_data");
      } catch {
        /* sessionStorage cleanup is best-effort */
      }
      (window as unknown as Record<string, unknown>).xlchess_payment_completed = false;
    };
  }, [session, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-accent/30 border-t-brand-accent animate-spin" />
      </div>
    );
  }

  if (!details) return null;

  const premiumFeatures = [
    "Unlimited Engine Analysis",
    "Unlimited Game Reviews",
    "Unlimited Puzzles",
    "Advanced Opening Explorer",
    "Performance Insights",
    "Premium Themes",
    "Priority Support",
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative overflow-hidden select-none pb-16">
      {/* Confetti celebration effect */}
      <Confetti />

      {/* Ambient background glows */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[900px] h-[400px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* SidebarLayout handles header globally */}

      {/* Main content wrapper */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4 py-12 w-full text-center">
        {/* Success Icon Block */}
        <div className="relative mb-6">
          {/* Radial emerald aura behind checks */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl scale-125 animate-pulse" />

          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 border border-emerald-400/40 flex items-center justify-center relative z-10">
            <svg
              className="w-10 h-10 text-brand-text"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-display font-medium text-brand-text tracking-wide mb-3">
          Payment Successful!
        </h1>

        {/* Subheadings */}
        <p className="text-base text-brand-text font-sans leading-relaxed px-2">
          Welcome to{" "}
          <span className="text-brand-accent font-semibold font-display italic">
            XLChess Premium
          </span>
          .
        </p>
        <p className="text-sm text-brand-secondary font-sans mt-1 mb-6">
          Your membership has been activated successfully.
        </p>

        {/* Premium Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-accent/15 border border-brand-accent/30 text-brand-accent text-xs font-mono tracking-wider uppercase font-semibold mb-8">
          <Award className="w-4 h-4 fill-current animate-pulse" />
          Premium Activated
        </div>

        {/* Summary Card */}
        <div className="w-full bg-brand-surface/60 backdrop-blur-xl border border-brand-border rounded-2xl p-5 sm:p-6 mb-8 text-left">
          <h3 className="text-sm font-mono tracking-wider text-brand-secondary uppercase border-b border-[rgba(212,175,110,0.40)] pb-3 mb-4">
            Membership Details
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-secondary font-sans">
                Active Plan
              </span>
              <span className="font-display font-medium text-brand-text text-gold-gradient">
                {details.selectedPlan}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-secondary font-sans">
                Billing Cycle
              </span>
              <span className="font-mono text-brand-text">
                {details.billingCycle}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm gap-2 sm:gap-4">
              <span className="text-brand-secondary font-sans shrink-0">
                Transaction ID
              </span>
              <span className="font-mono text-xs text-brand-accent text-right break-all [overflow-wrap:anywhere] min-w-0">
                {details.txnId}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-secondary font-sans">
                Purchase Date
              </span>
              <span className="font-sans text-brand-text">
                {details.purchaseDate}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-secondary font-sans">
                Next Renewal Date
              </span>
              <span className="font-sans text-brand-text">
                {details.renewalDate}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-secondary font-sans">Discount</span>
              <span className="font-mono text-emerald-400">
                -{details.discount}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-secondary font-sans">Currency</span>
              <span className="font-sans text-brand-text">
                {details.currency}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-[rgba(212,175,110,0.30)] pt-2">
              <span className="text-brand-secondary font-sans font-semibold">
                Total Paid
              </span>
              <span className="font-display font-bold text-brand-text text-gold-gradient text-base">
                {details.totalPaid}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-secondary font-sans">Username</span>
              <span className="font-sans text-brand-text font-semibold">
                {details.username}
              </span>
            </div>
          </div>
        </div>

        {/* Features list below */}
        <div className="w-full mb-8 text-left">
          <p className="text-xs font-mono text-brand-secondary uppercase tracking-wider mb-4 border-b border-[rgba(212,175,110,0.20)] pb-2">
            You now have access to:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
            {premiumFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm text-brand-text"
              >
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-sans">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Email Notification Note */}
        <p className="text-xs text-brand-secondary flex items-center justify-center gap-1.5 mb-8">
          <Mail className="w-3.5 h-3.5" />A confirmation email has been sent to
          your registered address.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full border-b border-[rgba(212,175,110,0.40)] pb-8 mb-6">
          <button
            onClick={() => navigate("/profile")}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold btn-premium-cta cta-shine cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => navigate("/puzzles")}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold bg-brand-text/5 border border-white/10 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-all duration-300 cursor-pointer active:scale-[0.99]"
          >
            Start Playing
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold bg-brand-text/5 border border-white/10 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-all duration-300 cursor-pointer active:scale-[0.99]"
          >
            View Membership
          </button>
        </div>

        {/* Footer Support section */}
        <div className="text-xs text-brand-secondary font-sans">
          Need help?{" "}
          <a
            href="mailto:support@xlchess.com"
            className="text-brand-accent hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
          >
            Contact Support
          </a>
        </div>
      </main>
    </div>
  );
}
