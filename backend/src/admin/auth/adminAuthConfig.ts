/**
 * Auth.js config for the admin portal — a second, fully separate instance from
 * the user-facing one in config/auth.ts. Different tables, different cookies.
 */

import Google from "@auth/express/providers/google";
import type { ExpressAuthConfig } from "@auth/express";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { adminPrismaAdapter } from "./adminPrismaAdapter.js";

const useSecureCookies = env.AUTH_URL.startsWith("https://");
const prefix = useSecureCookies ? "__Secure-" : "";

// Only `name` is overridden; Auth.js deep-merges the rest from its defaults.
// All six are renamed, not just the session cookie: the OAuth state/pkce/nonce
// cookies would otherwise collide with a user-facing sign-in running in the
// same browser at the same time.
const cookies = {
  sessionToken: { name: `${prefix}admin-authjs.session-token` },
  callbackUrl: { name: `${prefix}admin-authjs.callback-url` },
  csrfToken: { name: `${useSecureCookies ? "__Host-" : ""}admin-authjs.csrf-token` },
  pkceCodeVerifier: { name: `${prefix}admin-authjs.pkce.code_verifier` },
  state: { name: `${prefix}admin-authjs.state` },
  nonce: { name: `${prefix}admin-authjs.nonce` },
};

export const adminAuthConfig: ExpressAuthConfig = {
  // ExpressAuth overwrites this per request from the mount path, but getSession()
  // builds its URL from the config alone and would otherwise hit /api/auth.
  basePath: "/api/admin/auth",

  adapter: adminPrismaAdapter(),
  trustHost: env.AUTH_TRUST_HOST === "true",
  cookies,

  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      // Admins are seeded by email with no linked account, so the first sign-in
      // matches on email alone — which Auth.js otherwise rejects as
      // OAuthAccountNotLinked, making login impossible. Safe here because Google
      // is the only provider and it verifies the address.
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  session: {
    strategy: "database",
    maxAge: env.ADMIN_SESSION_MAX_AGE_SECONDS,
  },

  pages: { signIn: "/admin", error: "/admin" },

  callbacks: {
    // Runs before the adapter is asked to create or link anything, so a
    // non-admin never reaches createUser.
    async signIn({ user }) {
      if (!user.email) return false;

      const admin = await prisma.adminUser.findUnique({ where: { email: user.email } });
      if (!admin?.isActive) return false;

      await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
      return true;
    },

    async session({ session, user }) {
      if (user && session.user) session.user.id = user.id;
      return session;
    },

    async redirect({ url }) {
      const clientOrigin = (env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
      if (url.startsWith("/")) return `${clientOrigin}${url}`;

      try {
        const parsed = new URL(url);
        const authOrigin = new URL(env.AUTH_URL).origin;
        if (parsed.origin === authOrigin || parsed.hostname === "localhost") {
          return `${clientOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        return url;
      }

      return url;
    },
  },

  secret: env.AUTH_SECRET,
};
