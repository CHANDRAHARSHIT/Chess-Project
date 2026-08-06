import { motion, type Variants } from "framer-motion";
import { useNavigate } from "react-router";
import { FileText, ArrowLeft } from "lucide-react";
import { soundManager } from "../utils/SoundManager";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" },
  }),
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
  index: number;
}

function Section({ title, children, index }: SectionProps) {
  return (
    <motion.section
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="mb-10"
    >
      <h2 className="text-xl font-semibold mt-8 mb-3 text-brand-text border-b border-brand-border/40 pb-2">
        {title}
      </h2>
      <div className="space-y-3 text-brand-secondary leading-relaxed text-[15px]">
        {children}
      </div>
    </motion.section>
  );
}

export default function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-brand-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 via-transparent to-brand-accent/3 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-14 sm:pb-18 relative z-10">
          <div className="mb-5">
            <button
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                navigate("/");
              }}
              className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Home</span>
            </button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/5 mb-5">
              <FileText className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-xs font-mono text-brand-accent uppercase tracking-widest font-semibold">
                Legal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight tracking-tight">
              Terms of Service
            </h1>
            <p className="text-sm text-brand-secondary">
              Last updated: August 2026
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <motion.p
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-brand-secondary leading-relaxed text-[15px] mb-2"
        >
          Please read these Terms of Service carefully before using XLChess.
          By accessing or using our platform, you agree to be bound by these
          terms. If you do not agree to these terms, please do not use
          XLChess.
        </motion.p>

        <Section title="1. Acceptance of Terms" index={1}>
          <p>
            These Terms of Service ("Terms") constitute a legally binding
            agreement between you ("User," "you," or "your") and XLChess
            ("XLChess," "we," "us," or "our") governing your access to and
            use of the XLChess platform, including our website, applications,
            content, and related services (collectively, the "Service").
          </p>
          <p>
            By creating an account, accessing the platform, or otherwise using
            the Service, you confirm that you are at least 13 years of age,
            that you have read and understood these Terms, and that you agree
            to comply with them. If you are using the Service on behalf of an
            organization, you represent that you have the authority to bind
            that organization to these Terms.
          </p>
        </Section>

        <Section title="2. Account Registration and Security" index={2}>
          <p>
            To access certain features of XLChess, you must create an account.
            You agree to provide accurate, current, and complete information
            during registration and to keep your account information updated.
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account.
          </p>
          <p>
            You must notify us immediately at our contact page if you suspect
            any unauthorized access to your account. XLChess is not liable
            for any loss or damage arising from your failure to safeguard your
            account credentials. Each person may maintain only one account
            unless explicitly authorized otherwise by XLChess.
          </p>
        </Section>

        <Section title="3. Permitted Use and Prohibited Conduct" index={3}>
          <p>
            XLChess grants you a limited, non-exclusive, non-transferable,
            revocable license to access and use the Service for your personal,
            non-commercial chess education and entertainment purposes,
            subject to these Terms.
          </p>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Use chess engines, bots, or any automated tools during rated games or puzzles without express permission</li>
            <li>Harass, threaten, or abuse other users in any form</li>
            <li>Post or transmit content that is unlawful, defamatory, obscene, or infringes on any third-party rights</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure</li>
            <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
            <li>Use the Service for any commercial purpose without our prior written consent</li>
            <li>Circumvent or manipulate rating systems, leaderboards, or competitive features</li>
            <li>Create multiple accounts to evade bans or other enforcement actions</li>
          </ul>
        </Section>

        <Section title="4. Content and Intellectual Property" index={4}>
          <p>
            All content on XLChess — including text, graphics, software, audio,
            video, chess lessons, puzzles, and the platform design — is owned
            by or licensed to XLChess and is protected by applicable copyright,
            trademark, and intellectual property laws. You may not reproduce,
            distribute, or create derivative works from our content without
            explicit written permission.
          </p>
          <p>
            If you submit content to XLChess (such as game annotations,
            forum posts, or channel content), you retain ownership of that
            content but grant XLChess a worldwide, royalty-free, perpetual
            license to use, display, reproduce, and distribute it in connection
            with the Service.
          </p>
        </Section>

        <Section title="5. Subscriptions and Payments" index={5}>
          <p>
            XLChess offers both free and paid subscription tiers. Paid
            subscriptions are billed on a recurring basis (monthly or
            annually, as selected). By subscribing, you authorize XLChess to
            charge your payment method on a recurring basis until you cancel.
          </p>
          <p>
            You may cancel your subscription at any time from your account
            settings. Cancellation takes effect at the end of the current
            billing period; we do not provide pro-rated refunds for partial
            billing periods unless required by law. All prices are in US
            dollars unless otherwise stated and are subject to change with
            reasonable notice.
          </p>
        </Section>

        <Section title="6. Termination and Suspension" index={6}>
          <p>
            XLChess reserves the right to suspend or terminate your account
            at any time, with or without notice, if we determine that you have
            violated these Terms, engaged in fraudulent or abusive behavior,
            or if we are required to do so by law. Upon termination, your
            right to access the Service immediately ceases.
          </p>
          <p>
            You may delete your account at any time through your account
            settings. Following deletion, we will process the removal of your
            personal data in accordance with our Privacy Policy.
          </p>
        </Section>

        <Section title="7. Disclaimers and Limitation of Liability" index={7}>
          <p>
            The Service is provided "as is" and "as available" without
            warranties of any kind, either express or implied. XLChess does
            not warrant that the Service will be uninterrupted, error-free, or
            free of viruses or other harmful components.
          </p>
          <p>
            To the fullest extent permitted by law, XLChess and its officers,
            directors, employees, and agents shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages
            arising from your use of or inability to use the Service,
            regardless of whether XLChess was advised of the possibility of
            such damages.
          </p>
        </Section>

        <Section title="8. Governing Law and Dispute Resolution" index={8}>
          <p>
            These Terms are governed by and construed in accordance with the
            laws of the jurisdiction in which XLChess is incorporated, without
            regard to conflict of law principles. Any dispute arising from or
            relating to these Terms or your use of the Service shall be
            resolved through binding arbitration, except where prohibited by
            law.
          </p>
          <p>
            Before initiating arbitration, you agree to first attempt to
            resolve any dispute informally by contacting us. We will make
            good-faith efforts to resolve the dispute within 30 days of
            receiving your notice.
          </p>
        </Section>

        <Section title="9. Changes to These Terms" index={9}>
          <p>
            XLChess may modify these Terms at any time. We will provide notice
            of material changes by updating the date at the top of this page
            and, where appropriate, by notifying you via email. Your continued
            use of the Service after changes take effect constitutes your
            acceptance of the updated Terms. If you do not agree to the
            updated Terms, you must stop using the Service.
          </p>
        </Section>

        <Section title="10. Contact Us" index={10}>
          <p>
            If you have questions about these Terms or would like to report a
            violation, please reach out through our{" "}
            <a
              href="/contact"
              className="text-brand-accent hover:underline transition-colors"
            >
              contact page
            </a>
            . We take all reports seriously and aim to respond within two
            business days.
          </p>
        </Section>
      </div>
    </div>
  );
}
