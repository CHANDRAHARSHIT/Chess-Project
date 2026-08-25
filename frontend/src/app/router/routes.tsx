import HomePage from "@/pages/HomePage";
import ContactPage from "@/pages/ContactPage";
import JoinUsPage from "@/pages/JoinUsPage";
import PuzzlePage from "@/pages/PuzzlePage";
import { Navigate } from "react-router";
import SettingsPage from "@/pages/SettingsPage";
import PricingPage from "@/pages/PricingPage";
import CheckoutPage from "@/pages/CheckoutPage";
import SuccessfulPage from "@/pages/SuccessfulPage";
import FailedPage from "@/pages/FailedPage";
import PremiumPage from "@/pages/PremiumPage";
import OpeningsPage from "@/pages/OpeningsPage";
import Chess960Page from "@/pages/Chess960Page";
import LessonDashboardPage from "@/pages/LessonDashboardPage";
import LessonBuilderPage from "@/pages/LessonBuilderPage";
import AboutPage from "@/pages/AboutPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import CopyrightPage from "@/pages/CopyrightPage";
import CreatorPage from "@/pages/CreatorPage";
import AdvertisePage from "@/pages/AdvertisePage";
import DevelopersPage from "@/pages/DevelopersPage";
import HowXLChessWorksPage from "@/pages/HowXLChessWorksPage";
import { ProtectedRoute } from "@/features/account/ProtectedRoute";
import DatabasePage from "@/pages/DatabasePage";
import DatabasePlayerPage from "@/pages/DatabasePlayerPage";
import DatabaseGamePage from "@/pages/DatabaseGamePage";
import YourChannelPage from "@/pages/YourChannelPage";
import YourContentPage from "@/pages/YourContentPage";
import ReportPage from "@/pages/ReportPage";
import CompleteLaterPage from "@/pages/CompleteLaterPage";
import SubscriptionsPage from "@/pages/SubscriptionsPage";
import LessonsPage from "@/pages/LessonsPage";
import LessonViewerPage from "@/pages/LessonViewerPage";
import StoryModePage from "@/pages/StoryModePage";
import PlayHubPage from "@/pages/PlayHubPage";
import StatsPage from "@/pages/StatsPage";
import AssessmentPage from "@/pages/AssessmentPage";

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
    path: "/odyssey",
    element: <StoryModePage />,
    title: "Story Mode | XLChess",
  },
  {
    path: "/openings",
    element: <OpeningsPage />,
    title: "Chess Openings | XLChess",
  },
  {
    path: "/database",
    element: <DatabasePage />,
    title: "Chess Database | XLChess",
  },
  {
    path: "/database/:id",
    element: <DatabasePlayerPage />,
    title: "Player Database | XLChess",
  },
  {
    path: "/database/game/:id",
    element: <DatabaseGamePage />,
    title: "Game Database | XLChess",
  },
  {
    path: "/subscriptions",
    element: <SubscriptionsPage />,
    title: "My Subscriptions | XLChess",
  },
  {
    // /variants → Play Hub Variants tab. Navigate replace keeps browser history clean.
    path: "/variants",
    element: <Navigate to="/play?tab=variants" replace />,
    title: "Chess Variants | XLChess",
  },
  {
    path: "/play/chess960",
    element: <Chess960Page />,
    title: "Chess 960 | XLChess",
  },
  {
    path: "/lesson-builder",
    element: (
      <ProtectedRoute>
        <LessonDashboardPage />
      </ProtectedRoute>
    ),
    title: "Lesson Builder | XLChess",
  },
  {
    path: "/lesson-builder/:id",
    element: (
      <ProtectedRoute>
        <LessonBuilderPage />
      </ProtectedRoute>
    ),
    title: "Edit Lesson | XLChess",
  },
  {
    // /play/chess → Play Hub Online tab. Navigate replace keeps browser history clean.
    path: "/play/chess",
    element: <Navigate to="/play?tab=online" replace />,
    title: "Play Chess Online | XLChess",
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

  {
    path: "/play",
    element: <PlayHubPage />,
    title: "Play Chess | XLChess",
  },
  {
    path: "/lessons",
    element: <LessonsPage />,
    title: "Lesson Library | XLChess",
  },
  {
    path: "/lessons/:id",
    element: <LessonViewerPage />,
    title: "Chess Lesson | XLChess",
  },
  {
    path: "/lesson/:id",
    element: <LessonViewerPage />,
    title: "Chess Lesson | XLChess",
  },
  {
    path: "/stats",
    element: <StatsPage />,
    title: "Stats | XLChess",
  },
  {
    path: "/complete-later",
    element: <CompleteLaterPage />,
    title: "Complete Later | XLChess",
  },
  {
    path: "/your-content",
    element: <YourContentPage />,
    title: "Your Content | XLChess",
  },
  {
    path: "/channel",
    element: <YourChannelPage />,
    title: "Your Channel | XLChess",
  },
  {
    path: "/your-channel",
    element: <YourChannelPage />,
    title: "Your Channel | XLChess",
  },
  {
    path: "/report",
    element: <ReportPage />,
    title: "Report | XLChess",
  },

  // ── Footer page placeholder routes ───────────────────────────────────────
  {
    path: "/about",
    element: <AboutPage />,
    title: "About Us | XLChess",
  },
  {
    path: "/copyright",
    element: <CopyrightPage />,
    title: "Copyright | XLChess",
  },
  {
    path: "/creator",
    element: <CreatorPage />,
    title: "Creators | XLChess",
  },
  {
    path: "/advertise",
    element: <AdvertisePage />,
    title: "Advertise | XLChess",
  },
  {
    path: "/developers",
    element: <DevelopersPage />,
    title: "Developers | XLChess",
  },
  {
    path: "/terms",
    element: <TermsOfServicePage />,
    title: "Terms of Service | XLChess",
  },
  {
    path: "/privacy",
    element: <PrivacyPolicyPage />,
    title: "Privacy Policy | XLChess",
  },
  {
    path: "/how-xlchess-works",
    element: <HowXLChessWorksPage />,
    title: "How XLChess Works | XLChess",
  },
  {
    path: "/join-us",
    element: <JoinUsPage />,
    title: "Join Us | XLChess",
  },
  {
    path: "/join-us/:roleId",
    element: <JoinUsPage />,
    title: "Join Us | XLChess",
  },
];

// Routes that run inside the MinimalLayout (Navbar only, no Sidebar/Footer)
export const minimalRoutes: RouteConfig[] = [
  {
    path: "/join-us/:roleId/assessment",
    element: <AssessmentPage />,
    title: "Assessment | XLChess",
  },
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
