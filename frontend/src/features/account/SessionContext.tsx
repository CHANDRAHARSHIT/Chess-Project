import React, { useState, useEffect } from "react";
import type { Session } from "@auth/core/types";
import { useNavigate } from "react-router";
import rollbar from "@/shared/lib/rollbar";
import { SessionContext } from "./sessionContext.instance";

/**
 * SessionProvider manages client-side authentication state.
 *
 * It polls the session API at `/api/auth/session`, exposes the current authenticated
 * user session, loading state, and helper functions to trigger signIn and signOut.
 */
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"authenticated" | "unauthenticated" | "loading">("loading");
  const navigate = useNavigate();

  /** Fetches `/api/auth/session` and resolves to the session, or null if unauthenticated/failed. */
  const resolveSession = async (): Promise<Session | null> => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        // An empty JSON object {} represents an unauthenticated session in Auth.js
        if (data && Object.keys(data).length > 0) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch session:", error);
      // Falls back to unauthenticated below, so this never reaches the
      // ErrorBoundary — report it manually.
      rollbar.error(error as Error, { context: "SessionContext.fetchSession" });
      return null;
    }
  };

  const applySession = (data: Session | null): Session | null => {
    setSession(data);
    setStatus(data ? "authenticated" : "unauthenticated");
    return data;
  };

  /** Re-fetches and applies the current session — exposed to consumers as `updateSession`. */
  const fetchSession = async (): Promise<Session | null> => applySession(await resolveSession());

  useEffect(() => {
    // Chained here (rather than calling fetchSession() directly) so the setState calls are
    // visibly inside a .then() callback, not a bare call to a closure the effect can't see into.
    resolveSession().then(applySession);
  }, []);

  /**
   * Redirects the user to the provider-specific sign-in endpoint.
   * By default, it redirects to the Google OAuth flow using a POST request.
   */
  const signIn = async (provider: string = "google") => {
    setStatus("loading");
    try {
      // Auth.js endpoints require CSRF verification for sign-in POST requests.
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData?.csrfToken;

      // Create a hidden form and submit it to perform a browser-level POST navigation,
      // avoiding CORS blocking when Auth.js redirects the browser to the OAuth provider.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = `/api/auth/signin/${provider}`;
      form.style.display = "none";

      if (csrfToken) {
        const csrfInput = document.createElement("input");
        csrfInput.type = "hidden";
        csrfInput.name = "csrfToken";
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);
      }

      const callbackInput = document.createElement("input");
      callbackInput.type = "hidden";
      callbackInput.name = "callbackUrl";
      callbackInput.value = window.location.href;
      form.appendChild(callbackInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (error) {
      console.error("Error during sign in:", error);
      rollbar.error(error as Error, { context: "SessionContext.signIn", provider });
      setStatus("unauthenticated");
    }
  };

  /**
   * Triggers the sign-out process by submitting the CSRF token to Auth.js,
   * then updates the client-side authentication state and redirects to home.
   */
  const signOut = async () => {
    setStatus("loading");
    try {
      // Auth.js endpoints require CSRF verification for destructive POST requests.
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData?.csrfToken;

      const searchParams = new URLSearchParams();
      if (csrfToken) {
        searchParams.append("csrfToken", csrfToken);
      }
      searchParams.append("json", "true");

      await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: searchParams.toString(),
      });

      setSession(null);
      setStatus("unauthenticated");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during sign out:", error);
      rollbar.error(error as Error, { context: "SessionContext.signOut" });
      setSession(null);
      setStatus("unauthenticated");
      navigate("/", { replace: true });
    }
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        status,
        updateSession: fetchSession,
        signIn,
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
