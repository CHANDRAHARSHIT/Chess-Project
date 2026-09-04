/**
 * Auth.js adapter over the AdminUser/AdminAccount/AdminSession tables.
 *
 * Hand-written rather than @auth/prisma-adapter, whose delegate names are fixed
 * to user/account/session — redirecting it needs a runtime Proxy that breaks
 * silently on a library bump.
 */

import type { Adapter, AdapterAccount, AdapterSession, AdapterUser } from "@auth/core/adapters";
import { prisma } from "../../config/prisma.js";
import type { AdminUserModel } from "../../generated/prisma/models.js";

// AdminUser has no emailVerified column: admins are provisioned by seed, and the
// email is already verified by Google before sign-in is allowed.
function toAdapterUser(admin: AdminUserModel): AdapterUser {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    image: admin.avatarUrl,
    emailVerified: null,
  };
}

export function adminPrismaAdapter(): Adapter {
  return {
    async createUser() {
      throw new Error("Admin accounts cannot be self-provisioned.");
    },

    async getUser(id) {
      const admin = await prisma.adminUser.findUnique({ where: { id } });
      return admin && toAdapterUser(admin);
    },

    async getUserByEmail(email) {
      const admin = await prisma.adminUser.findUnique({ where: { email } });
      return admin && toAdapterUser(admin);
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.adminAccount.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { adminUser: true },
      });
      return account && toAdapterUser(account.adminUser);
    },

    async updateUser({ id, name, image }) {
      const admin = await prisma.adminUser.update({
        where: { id },
        data: { name, avatarUrl: image },
      });
      return toAdapterUser(admin);
    },

    // Columns are listed rather than spread: AdapterAccount carries provider-specific
    // extras (expires_in, and so on) that Prisma rejects as unknown fields.
    async linkAccount(account: AdapterAccount) {
      await prisma.adminAccount.create({
        data: {
          adminUserId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state as string | undefined,
        },
      });
    },

    async createSession({ sessionToken, userId, expires }) {
      const session = await prisma.adminSession.create({
        data: { sessionToken, adminUserId: userId, expires },
      });
      return { sessionToken: session.sessionToken, userId: session.adminUserId, expires: session.expires };
    },

    async getSessionAndUser(sessionToken) {
      const session = await prisma.adminSession.findUnique({
        where: { sessionToken },
        include: { adminUser: true },
      });
      if (!session) return null;
      return {
        session: { sessionToken: session.sessionToken, userId: session.adminUserId, expires: session.expires },
        user: toAdapterUser(session.adminUser),
      };
    },

    async updateSession({ sessionToken, expires }): Promise<AdapterSession | null> {
      const session = await prisma.adminSession.update({
        where: { sessionToken },
        data: { expires },
      });
      return { sessionToken: session.sessionToken, userId: session.adminUserId, expires: session.expires };
    },

    async deleteSession(sessionToken) {
      // Signing out twice, or after the row expired away, must not throw.
      await prisma.adminSession.deleteMany({ where: { sessionToken } });
    },
  };
}
