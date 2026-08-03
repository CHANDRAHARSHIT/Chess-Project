import { useEffect } from "react";
import { useLocation, matchPath } from "react-router";
import { mainRoutes, minimalRoutes } from "../router/routes";

const ALL_ROUTES = [...mainRoutes, ...minimalRoutes];
const DEFAULT_TITLE = "XLChess - Chess Platform";

export function useDocumentTitle() {
  const location = useLocation();

  useEffect(() => {
    const currentRoute = ALL_ROUTES.find((route) =>
      matchPath({ path: route.path, end: true }, location.pathname)
    );

    if (currentRoute && currentRoute.title) {
      document.title = currentRoute.title;
    } else if (location.pathname === "/") {
      document.title = DEFAULT_TITLE;
    } else {
      document.title = "Page Not Found | XLChess";
    }
  }, [location.pathname]);
}
