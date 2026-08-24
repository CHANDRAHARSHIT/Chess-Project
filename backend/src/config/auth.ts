import Google from "@auth/express/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { ExpressAuthConfig } from "@auth/express";
import { prisma } from "./prisma.js";
import { env } from "./env.js";

export const authConfig: ExpressAuthConfig = {
  // Bind Auth.js to the database via Prisma Adapter
  adapter: PrismaAdapter(prisma as any),
  
  // Trust the host header (required for custom environments / reverse proxy setups)
  trustHost: env.AUTH_TRUST_HOST === "true",

  // Define authentication providers
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],

  // Secure session handling using Database Sessions
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callbacks to enrich session details
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        token.id = user.id;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, user, token }) {
      if (user && session.user) {
        session.user.id = user.id;
      } else if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url }) {
      const clientOrigin = (env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
      let authOrigin: string;
      try {
        authOrigin = new URL(env.AUTH_URL).origin;
      } catch {
        authOrigin = "http://localhost:3000";
      }

      // Relative paths always redirect to the frontend origin.
      if (url.startsWith("/")) {
        return `${clientOrigin}${url}`;
      }

      // Rewrite backend/auth-origin URLs back to the frontend (local dev + deployed proxy setups).
      try {
        const parsed = new URL(url);
        if (parsed.origin === authOrigin || parsed.hostname === "localhost") {
          return `${clientOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        return url;
      }

      return url;
    },
  },

  // Encryption secret for JWT tokens and session data
  secret: env.AUTH_SECRET,
};
