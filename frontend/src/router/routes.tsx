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
import SubscriptionsPage from "../pages/SubscriptionsPage";
import VariantsPage from "../pages/VariantsPage";
import Chess960Page from "../pages/Chess960Page";
import QuickGamePage from "../pages/QuickGamePage";
import { ProtectedRoute } from "../components/ProtectedRoute";

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  title?: string;
}

// Routes that run inside the MainLayout (Navbar + Sidebar + Footer)
export const mainRoutes: RouteConfig[] = [
  { path: "/", element: <HomePage /> },
  { path: "/play", element: <QuickGamePage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/puzzles", element: <PuzzlePage /> },
  { path: "/openings", element: <OpeningsPage /> },
  { path: "/subscriptions", element: <SubscriptionsPage /> },
  { path: "/variants", element: <VariantsPage /> },
  { path: "/play/chess960", element: <Chess960Page /> },
  {
    path: "/profile",
    element: <Navigate to="/settings/profile" replace />,
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
