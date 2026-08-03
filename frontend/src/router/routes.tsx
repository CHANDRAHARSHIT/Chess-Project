import HomePage from "../pages/HomePage";
import ContactPage from "../pages/ContactPage";
import PuzzlePage from "../pages/PuzzlePage";
import { Navigate } from "react-router";
import SettingsPage from "../pages/SettingsPage";
import PricingPage from "../pages/PricingPage";
import CheckoutPage from "../pages/CheckoutPage";
import SuccessfulPage from "../pages/SuccessfulPage";
import FailedPage from "../pages/FailedPage";
import PremiumPage from "../pages/PremiumPage";
import OpeningsPage from "../pages/OpeningsPage";
import Chess960Page from "../pages/Chess960Page";
import ComingSoonPage from "../pages/ComingSoonPage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import {
  BookOpen,
  BarChart2,
  Clock,
  Video,
  UserCircle2,
  Users,
  Shuffle,
  Flag,
  Info,
  Copyright,
  Paintbrush,
  Megaphone,
  Code2,
  FileText,
  Shield,
  HelpCircle,
} from "lucide-react";
import QuickGamePage from "../pages/QuickGamePage";

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  title?: string;
}

// Routes that run inside the MainLayout (Navbar + Sidebar + Footer)
export const mainRoutes: RouteConfig[] = [
  { path: "/", element: <HomePage />, title: "XLChess - Play Chess Online" },
  { path: "/contact", element: <ContactPage />, title: "Contact Us | XLChess" },
  {
    path: "/puzzles",
    element: <PuzzlePage />,
    title: "Chess Puzzles | XLChess",
  },
  {
    path: "/openings",
    element: <OpeningsPage />,
    title: "Chess Openings | XLChess",
  },
  {
    path: "/subscriptions",
    element: (
      <ComingSoonPage
        featureName="Subscriptions"
        description="Follow your favorite chess creators and stay up to date with their latest content, video analysis, and interactive lessons."
        icon={Users}
      />
    ),
    title: "My Subscriptions | XLChess",
  },
  {
    path: "/variants",
    element: (
      <ComingSoonPage
        featureName="Chess Variants"
        description="Explore exciting chess variants like Chess960, King of the Hill, 3-Check, and custom rulesets — bringing fresh strategic challenges and endless fun to the board."
        icon={Shuffle}
      />
    ),
    title: "Chess Variants | XLChess",
  },
  {
    path: "/play/chess960",
    element: <Chess960Page />,
    title: "Chess 960 | XLChess",
  },
  {
    path: "/profile",
    element: <Navigate to="/settings/profile" replace />,
    title: "Profile | XLChess",
  },
  // Not behind ProtectedRoute: board/piece preferences are stored in
  // localStorage (like the Sound toggle) so guests can use them too.
  { path: "/settings", element: <SettingsPage />, title: "Settings | XLChess" },
  {
    path: "/settings/:category",
    element: <SettingsPage />,
    title: "Settings | XLChess",
  },
  {
    path: "/premium",
    element: (
      <ProtectedRoute>
        <PremiumPage />
      </ProtectedRoute>
    ),
    title: "XLChess Premium | XLChess",
  },
  { path: "/pricing", element: <PricingPage />, title: "Pricing | XLChess" },

  // ── Coming Soon placeholder routes ──────────────────────────────────────
  {
    path: "/play",
    element: <QuickGamePage />,
    title: "Play Chess | XLChess",
  },
  {
    path: "/lessons",
    element: (
      <ComingSoonPage
        featureName="Lessons"
        description="Structured, interactive chess lessons designed to sharpen your openings, tactics, endgames, and overall strategic thinking — at every level."
        icon={BookOpen}
      />
    ),
    title: "Lessons | XLChess",
  },
  {
    path: "/stats",
    element: (
      <ComingSoonPage
        featureName="Your Stats"
        description="Track your progress with detailed performance analytics — win/loss history, rating trends, puzzle accuracy, and opening success rates."
        icon={BarChart2}
      />
    ),
    title: "Stats | XLChess",
  },
  {
    path: "/complete-later",
    element: (
      <ComingSoonPage
        featureName="Complete Later"
        description="Save lessons, puzzles, or games you want to revisit. Your personal queue for picking up where you left off — anytime."
        icon={Clock}
      />
    ),
    title: "Complete Later | XLChess",
  },
  {
    path: "/your-content",
    element: (
      <ComingSoonPage
        featureName="Your Content"
        description="Manage and review all the chess content you've created or saved — annotated games, custom lessons, and video analyses."
        icon={Video}
      />
    ),
    title: "Your Content | XLChess",
  },
  {
    path: "/channel",
    element: (
      <ComingSoonPage
        featureName="Your Channel"
        description="Build your own chess channel to share insights, stream games, and grow a following within the XLChess community."
        icon={UserCircle2}
      />
    ),
    title: "Your Channel | XLChess",
  },
  {
    path: "/report",
    element: (
      <ComingSoonPage
        featureName="Report"
        description="Help keep the XLChess community safe and fair. Submit reports for unsportsmanlike conduct, cheating, or inappropriate content."
        icon={Flag}
      />
    ),
    title: "Report | XLChess",
  },

  // ── Footer page placeholder routes ───────────────────────────────────────
  {
    path: "/about",
    element: (
      <ComingSoonPage
        featureName="About"
        description="Learn about the story behind XLChess — our mission to make high-quality chess education and play accessible to everyone, everywhere."
        icon={Info}
      />
    ),
    title: "About Us | XLChess",
  },
  {
    path: "/copyright",
    element: (
      <ComingSoonPage
        featureName="Copyright"
        description="All content on XLChess, including lessons, graphics, and software, is protected by copyright. Details on permitted use will be published here."
        icon={Copyright}
      />
    ),
    title: "Copyright | XLChess",
  },
  {
    path: "/creator",
    element: (
      <ComingSoonPage
        featureName="Creator"
        description="Tools, resources, and guidelines for chess creators who want to share their knowledge and build an audience on XLChess."
        icon={Paintbrush}
      />
    ),
    title: "Creators | XLChess",
  },
  {
    path: "/advertise",
    element: (
      <ComingSoonPage
        featureName="Advertise"
        description="Reach a passionate chess community. Information about advertising opportunities and partnerships on XLChess will be available here."
        icon={Megaphone}
      />
    ),
    title: "Advertise | XLChess",
  },
  {
    path: "/developers",
    element: (
      <ComingSoonPage
        featureName="Developers"
        description="Explore the XLChess API, webhooks, and developer documentation to build integrations and extend the platform."
        icon={Code2}
      />
    ),
    title: "Developers | XLChess",
  },
  {
    path: "/terms",
    element: (
      <ComingSoonPage
        featureName="Terms of Service"
        description="Our Terms of Service outline the rules and guidelines for using XLChess. Please review them carefully before using the platform."
        icon={FileText}
      />
    ),
    title: "Terms of Service | XLChess",
  },
  {
    path: "/privacy",
    element: (
      <ComingSoonPage
        featureName="Privacy Policy & Safety"
        description="Understand how XLChess collects, uses, and protects your personal data, and what safety measures are in place to keep you secure."
        icon={Shield}
      />
    ),
    title: "Privacy Policy | XLChess",
  },
  {
    path: "/how-xlchess-works",
    element: (
      <ComingSoonPage
        featureName="How XLChess Works"
        description="A complete guide to XLChess — how to play games, solve puzzles, follow creators, track your progress, and make the most of the platform."
        icon={HelpCircle}
      />
    ),
    title: "How XLChess Works | XLChess",
  },
];

// Routes that run inside the MinimalLayout (Navbar only, no Sidebar/Footer)
export const minimalRoutes: RouteConfig[] = [
  { path: "/payment", element: <CheckoutPage />, title: "Checkout | XLChess" },
  {
    path: "/successful",
    element: <SuccessfulPage />,
    title: "Payment Successful | XLChess",
  },
  {
    path: "/payment/success",
    element: <SuccessfulPage />,
    title: "Payment Successful | XLChess",
  },
  {
    path: "/payment/failed",
    element: <FailedPage />,
    title: "Payment Failed | XLChess",
  },
];
