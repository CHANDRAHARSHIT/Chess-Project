import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Copyright } from "lucide-react";
import { motion, type Variants } from "framer-motion";
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
      <h2 className="font-display text-xl font-semibold mt-8 mb-3 text-brand-text border-b border-brand-border/40 pb-2">
        {title}
      </h2>
      <div className="space-y-3 text-brand-secondary leading-relaxed text-[15px]">
        {children}
      </div>
    </motion.section>
  );
}

export default function CopyrightPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-bg text-brand-text flex flex-col pt-6 pb-12">
      {/* Back to Home */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-6 sm:mb-8">
        <button
          type="button"
          onClick={() => { soundManager.playButtonClick(); navigate("/"); }}
          className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </button>
      </div>
      <div className="flex-1">
      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-brand-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 via-transparent to-brand-accent/3 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-14 sm:py-18 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/5 mb-5">
              <Copyright className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-xs font-mono text-brand-accent uppercase tracking-widest font-semibold">
                Legal
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3 leading-tight tracking-tight">
              Copyright Information
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
          XLChess takes intellectual property rights seriously. This page
          describes how copyright applies to content on the XLChess platform,
          the rights you retain over content you create, and the process for
          reporting copyright infringement.
        </motion.p>

        <Section title="Ownership of XLChess Content" index={1}>
          <p>
            All original content produced by XLChess — including but not
            limited to chess lessons, instructional videos, puzzle sets, user
            interface design elements, written guides, graphics, branding
            assets, and software code — is the exclusive intellectual property
            of XLChess or its licensed content partners. This content is
            protected under applicable copyright law.
          </p>
          <p>
            Unauthorized reproduction, redistribution, modification, or public
            display of XLChess-owned content — in whole or in part — is
            strictly prohibited without prior written consent from XLChess.
            This includes screen-recording lessons for re-upload, copying
            puzzle databases, or embedding our proprietary video player on
            external websites without an API agreement.
          </p>
        </Section>

        <Section title="User-Generated Content" index={2}>
          <p>
            When you submit content to XLChess — such as annotated games,
            written commentary, forum posts, channel videos, or lesson
            materials — you retain full copyright ownership of that content.
            By submitting content, you grant XLChess a non-exclusive,
            worldwide, royalty-free license to host, display, distribute, and
            promote that content within the platform.
          </p>
          <p>
            You represent that you own or have the necessary rights to all
            content you submit, and that your content does not infringe the
            intellectual property rights of any third party. XLChess reserves
            the right to remove content that violates these representations
            without prior notice.
          </p>
        </Section>

        <Section title="DMCA and Copyright Takedown Requests" index={3}>
          <p>
            XLChess complies with the Digital Millennium Copyright Act (DMCA)
            and equivalent legislation in other jurisdictions. If you believe
            that content on XLChess infringes your copyright, you may submit a
            takedown request via our contact page. Your notice must include:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>A description of the copyrighted work you claim has been infringed</li>
            <li>A URL or specific location of the allegedly infringing material on XLChess</li>
            <li>Your contact information (name, email, physical address)</li>
            <li>A statement that you have a good-faith belief the use is unauthorized</li>
            <li>A statement, under penalty of perjury, that the information in your notice is accurate</li>
            <li>Your physical or electronic signature</li>
          </ul>
          <p>
            We will investigate all valid notices and take appropriate action,
            which may include removing the content in question. Repeat
            infringers will have their accounts terminated.
          </p>
        </Section>

        <Section title="Fair Use and Educational Content" index={4}>
          <p>
            XLChess supports the educational use of chess content. Short
            excerpts from publicly available chess games, opening theory, and
            historical game records are generally considered to be in the
            public domain and are not subject to copyright. XLChess uses this
            material under fair use principles to power our lessons and puzzle
            database.
          </p>
          <p>
            If you are a researcher, educator, or journalist and wish to use
            XLChess content for non-commercial educational purposes, please
            contact us. We are generally supportive of legitimate educational
            use and will consider your request on a case-by-case basis.
          </p>
        </Section>

        <Section title="Third-Party Content and Licenses" index={5}>
          <p>
            XLChess may include content licensed from third parties, including
            chess engine technology, font licenses, icon libraries, and music.
            All such content is used in accordance with the applicable license
            terms. Attribution is provided where required. If you believe a
            specific piece of third-party content has been used incorrectly,
            please contact us.
          </p>
        </Section>

        <Section title="Contact" index={6}>
          <p>
            For all copyright-related inquiries — including takedown requests,
            licensing questions, and fair use determinations — please use our{" "}
            <a
              href="/contact"
              className="text-brand-accent hover:underline transition-colors"
            >
              contact page
            </a>
            . We aim to respond to all copyright matters within five business
            days.
          </p>
        </Section>
      </div>
      </div>
    </div>
  );
}
