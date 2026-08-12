import { useContext } from "react";
import { SessionContext } from "@/context/sessionContext.instance";
import type { SessionContextType } from "@/context/sessionContext.instance";

/**
 * Custom React hook to retrieve the current session and status.
 *
 * This hook requires that the calling component is wrapped in a `<SessionProvider>`.
 *
 * @returns {SessionContextType} The session context, containing the user session, status, and control actions.
 * @throws {Error} If the hook is used outside of a SessionProvider.
 */
export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
