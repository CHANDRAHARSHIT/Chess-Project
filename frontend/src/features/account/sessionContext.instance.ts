/**
 * sessionContext.instance.ts
 * The Context object and its type live here, separate from the provider component in
 * SessionContext.tsx, so that file can export only a component (react-refresh/
 * only-export-components requires a component-only file for Fast Refresh to work).
 */
import { createContext } from "react";
import type { Session } from "@auth/core/types";

export type AuthStatus = "authenticated" | "unauthenticated" | "loading";

export interface SessionContextType {
  session: Session | null;
  status: AuthStatus;
  authHint: "authenticated" | "unauthenticated";
  updateSession: () => Promise<Session | null>;
  signIn: (provider?: string) => void;
  signOut: () => void;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);
