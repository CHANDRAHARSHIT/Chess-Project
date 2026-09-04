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
import TestMaiaPage from "@/pages/TestMaiaPage";
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
import NewsPage from "@/pages/NewsPage";
import { ROUTES } from "./routes.config";

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  title?: string;
}

// Routes that run inside the MainLayout (Navbar + Sidebar + Footer)
export const mainRoutes: RouteConfig[] = [
  // Core Application
  { path: ROUTES.HOME, element: <HomePage />, title: "XLChess - Play Chess Online" },
  { path: ROUTES.NEWS, element: <NewsPage />, title: "News & Ratings | XLChess" },
  { path: ROUTES.CONTACT, element: <ContactPage />, title: "Contact Us | XLChess" },
  { path: ROUTES.PUZZLES, element: <PuzzlePage />, title: "Chess Puzzles | XLChess" },
  { path: ROUTES.ODYSSEY, element: <StoryModePage />, title: "Story Mode | XLChess" },
  { path: ROUTES.OPENINGS, element: <OpeningsPage />, title: "Chess Openings | XLChess" },
  { path: ROUTES.PRICING, element: <PricingPage />, title: "Pricing | XLChess" },
  {
    path: ROUTES.PREMIUM,
    element: (
      <ProtectedRoute>
        <PremiumPage />
      </ProtectedRoute>
    ),
    title: "XLChess Premium | XLChess",
  },
  { path: ROUTES.STATS, element: <StatsPage />, title: "Stats | XLChess" },
  { path: ROUTES.REPORT, element: <ReportPage />, title: "Report | XLChess" },

  // Database
  { path: ROUTES.DATABASE, element: <DatabasePage />, title: "Chess Database | XLChess" },
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

  // Subscriptions & Library
  {
    path: ROUTES.SUBSCRIPTIONS,
    element: <SubscriptionsPage />,
    title: "My Subscriptions | XLChess",
  },
  {
    path: ROUTES.SAVED,
    element: <CompleteLaterPage />,
    title: "Saved | XLChess",
  },
  {
    path: ROUTES.CONTENT,
    element: <YourContentPage />,
    title: "Your Content | XLChess",
  },
  {
    path: ROUTES.CHANNEL,
    element: <YourChannelPage />,
    title: "Your Channel | XLChess",
  },

  // Play Hub
  {
    path: ROUTES.PLAY,
    element: <PlayHubPage />,
    title: "Play Chess | XLChess",
  },
  {
    path: ROUTES.PLAY_CHESS960,
    element: <Chess960Page />,
    title: "Chess 960 | XLChess",
  },
  {
    path: ROUTES.MAIA,
    element: <TestMaiaPage />,
    title: "Test Maia | XLChess",
  },

  // Lessons & Lesson Builder
  {
    path: ROUTES.LESSONS,
    element: <LessonsPage />,
    title: "Lesson Library | XLChess",
  },
  {
    path: "/lessons/:id",
    element: <LessonViewerPage />,
    title: "Chess Lesson | XLChess",
  },
  {
    path: ROUTES.LESSON_BUILDER,
    element: (
      <ProtectedRoute>
        <LessonDashboardPage />
      </ProtectedRoute>
    ),
    title: "Lesson Builder | XLChess",
  },
  {
    path: "/lessons/builder/:id",
    element: (
      <ProtectedRoute>
        <LessonBuilderPage />
      </ProtectedRoute>
    ),
    title: "Edit Lesson | XLChess",
  },

  // Settings & Profile
  { path: ROUTES.PROFILE, element: <Navigate to={ROUTES.SETTINGS_PROFILE} replace />, title: "Profile | XLChess" },
  { path: ROUTES.SETTINGS, element: <SettingsPage />, title: "Settings | XLChess" },
  {
    path: "/settings/:category",
    element: <SettingsPage />,
    title: "Settings | XLChess",
  },

  // Informational / Footer Pages
  { path: ROUTES.ABOUT, element: <AboutPage />, title: "About Us | XLChess" },
  { path: ROUTES.COPYRIGHT, element: <CopyrightPage />, title: "Copyright | XLChess" },
  { path: ROUTES.CREATOR, element: <CreatorPage />, title: "Creators | XLChess" },
  { path: ROUTES.ADVERTISE, element: <AdvertisePage />, title: "Advertise | XLChess" },
  { path: ROUTES.DEVELOPERS, element: <DevelopersPage />, title: "Developers | XLChess" },
  { path: ROUTES.TERMS, element: <TermsOfServicePage />, title: "Terms of Service | XLChess" },
  { path: ROUTES.PRIVACY, element: <PrivacyPolicyPage />, title: "Privacy Policy | XLChess" },
  {
    path: ROUTES.HOW_IT_WORKS,
    element: <HowXLChessWorksPage />,
    title: "How XLChess Works | XLChess",
  },
];

// Routes that run inside the MinimalLayout (Navbar only, no Sidebar/Footer)
export const minimalRoutes: RouteConfig[] = [
  // Join & Career Flow
  {
    path: ROUTES.JOIN,
    element: <JoinUsPage />,
    title: "Join Us | XLChess",
  },
  {
    path: ROUTES.JOIN_ASSESSMENT,
    element: (
      <ProtectedRoute>
        <AssessmentPage />
      </ProtectedRoute>
    ),
    title: "Assessment | XLChess",
  },

  // Checkout & Payment Flow
  { path: ROUTES.PAYMENT, element: <CheckoutPage />, title: "Checkout | XLChess" },
  {
    path: ROUTES.PAYMENT_SUCCESS,
    element: <SuccessfulPage />,
    title: "Payment Successful | XLChess",
  },
  {
    path: ROUTES.PAYMENT_FAILED,
    element: <FailedPage />,
    title: "Payment Failed | XLChess",
  },
];
