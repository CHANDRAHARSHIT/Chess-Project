import { useEffect } from "react";
import { useLocation, matchPath } from "react-router";
import { mainRoutes, minimalRoutes } from "@/router/routes";

const ALL_ROUTES = [...mainRoutes, ...minimalRoutes];
const DEFAULT_TITLE = "XLChess - Chess Platform";

export function useDocumentTitle() {
  const location = useLocation();

  useEffect(() => {
    const currentRoute = ALL_ROUTES.find((route) =>
      matchPath({ path: route.path, end: true }, location.pathname)
    );

    if (currentRoute) {
      if (currentRoute.title) {
        document.title = currentRoute.title;
      } else if (location.pathname === "/") {
        document.title = DEFAULT_TITLE;
      } else {
        const pathSegment = location.pathname.split("/").filter(Boolean)[0];
        const formattedName = pathSegment
          ? pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1)
          : "XLChess";
        document.title = `${formattedName} | XLChess`;
      }
    } else {
      document.title = "Page Not Found | XLChess";
    }
  }, [location.pathname]);
}
