import { useContext } from "react";
import { NavigationStackContext } from "@/contexts/nav-navigationStackContext.instance";
import type { NavigationStackContextType } from "@/contexts/nav-navigationStackContext.instance";

/**
 * Custom React hook to access the global navigation stack.
 *
 * Pages can push the current location before navigating elsewhere,
 * allowing destination pages to navigate back to the previous page
 * without hardcoding routes.
 *
 * This hook requires that the calling component is wrapped in a
 * `<NavigationStackProvider>`.
 *
 * @throws {Error} If used outside of a NavigationStackProvider.
 */
export function useNavigationStack(): NavigationStackContextType {
  const context = useContext(NavigationStackContext);

  if (context === undefined) {
    throw new Error(
      "useNavigationStack must be used within a NavigationStackProvider",
    );
  }

  return context;
}