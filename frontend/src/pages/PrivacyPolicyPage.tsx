import { motion, type Variants } from "framer-motion";
import { useNavigate } from "react-router";
import { Shield, ArrowLeft } from "lucide-react";
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

export default function PrivacyPolicyPage() {
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
              <Shield className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-xs font-mono text-brand-accent uppercase tracking-widest font-semibold">
                Legal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight tracking-tight">
              Privacy Policy &amp; Safety
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
          At XLChess, your privacy is a core responsibility, not an
          afterthought. This Privacy Policy explains what information we
          collect, why we collect it, how we use it, and the choices you have
          regarding your data. By using XLChess, you agree to the practices
          described in this policy.
        </motion.p>

        <Section title="1. Information We Collect" index={1}>
          <p>
            We collect information you provide directly to us, such as your
            name, email address, username, and password when you create an
            account. If you subscribe to a paid plan, our payment processor
            collects billing information on our behalf; XLChess does not store
            full credit card numbers on its servers.
          </p>
          <p>
            We also collect information automatically as you use the platform,
            including your IP address, browser type, operating system, pages
            visited, time spent on pages, game moves and puzzle activity, and
            referring URLs. This data helps us understand how the platform is
            used and how we can improve it.
          </p>
          <p>
            If you connect a third-party account (such as Google or Discord) to
            XLChess, we receive basic profile information such as your display
            name and email address as permitted by that service.
          </p>
        </Section>

        <Section title="2. How We Use Your Information" index={2}>
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Create and manage your XLChess account</li>
            <li>Provide, operate, and improve our services</li>
            <li>Personalize your learning experience and recommendations</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send you transactional emails (account confirmations, password resets)</li>
            <li>Send you platform announcements and newsletters (you may opt out at any time)</li>
            <li>Monitor and prevent fraudulent or abusive activity</li>
            <li>Comply with our legal obligations</li>
          </ul>
          <p>
            We do not sell your personal information to third parties. We do
            not use your gameplay data to build advertising profiles.
          </p>
        </Section>

        <Section title="3. Cookies and Tracking Technologies" index={3}>
          <p>
            XLChess uses cookies and similar tracking technologies to keep you
            signed in, remember your preferences (such as board theme and
            sound settings), and analyze platform usage. You can configure your
            browser to refuse cookies; however, some features of the platform
            may not function correctly without them.
          </p>
          <p>
            We use privacy-respecting analytics tools to measure aggregate
            traffic patterns and feature engagement. These tools are configured
            to anonymize IP addresses and do not share individual-level data
            with advertising networks.
          </p>
        </Section>

        <Section title="4. Data Sharing and Disclosure" index={4}>
          <p>
            We share your information only in the following limited
            circumstances:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              With service providers who help us operate the platform (for
              example, cloud hosting, payment processing, and email delivery),
              under strict confidentiality agreements
            </li>
            <li>
              When required by law, court order, or to protect the rights and
              safety of XLChess, our users, or the public
            </li>
            <li>
              In connection with a merger, acquisition, or sale of assets, in
              which case we will notify you before your data is transferred
            </li>
          </ul>
          <p>
            Public profile information (username, rating, and game history) may
            be visible to other users by default. You can adjust your privacy
            settings to limit what is publicly visible.
          </p>
        </Section>

        <Section title="5. Data Retention" index={5}>
          <p>
            We retain your account information for as long as your account is
            active. If you delete your account, we will delete or anonymize
            your personal data within 30 days, except where we are required to
            retain it for legal compliance, fraud prevention, or dispute
            resolution.
          </p>
          <p>
            Anonymized, aggregated data (such as aggregate puzzle completion
            statistics) may be retained indefinitely for platform improvement
            purposes.
          </p>
        </Section>

        <Section title="6. Your Rights and Choices" index={6}>
          <p>
            Depending on your location, you may have the right to access,
            correct, or delete your personal data; restrict or object to
            certain processing; and port your data to another service. To
            exercise any of these rights, please contact us at{" "}
            <a
              href="/contact"
              className="text-brand-accent hover:underline transition-colors"
            >
              our contact page
            </a>
            . We will respond within 30 days.
          </p>
          <p>
            You can also manage many of these preferences directly from your
            account settings, including opting out of marketing emails and
            controlling your profile visibility.
          </p>
        </Section>

        <Section title="7. Security" index={7}>
          <p>
            We use industry-standard security measures to protect your
            information, including encryption of data in transit (TLS) and at
            rest, hashed and salted passwords, and regular security audits.
            While we strive to protect your information, no system is
            completely secure. We encourage you to use a strong, unique
            password and to enable two-factor authentication where available.
          </p>
        </Section>

        <Section title="8. Children's Privacy" index={8}>
          <p>
            XLChess is not directed at children under the age of 13. We do not
            knowingly collect personal information from children under 13. If
            you believe we have inadvertently collected such information, please
            contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="9. Changes to This Policy" index={9}>
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices or legal requirements. When we make
            material changes, we will notify you by updating the date at the
            top of this page and, where appropriate, by sending you an email.
            We encourage you to review this policy periodically.
          </p>
        </Section>

        <Section title="10. Contact Us" index={10}>
          <p>
            If you have questions, concerns, or requests regarding this Privacy
            Policy or the handling of your personal data, please reach out to
            us through our{" "}
            <a
              href="/contact"
              className="text-brand-accent hover:underline transition-colors"
            >
              contact page
            </a>
            . We are committed to addressing your concerns promptly and
            transparently.
          </p>
        </Section>
      </div>
    </div>
  );
}
