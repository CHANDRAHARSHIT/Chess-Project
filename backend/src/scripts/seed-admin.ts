/**
 * seed-admin.ts
 * -------------
 * Provisions the super admin and the ACS navigation tree.
 * Safe to re-run: every write is an upsert keyed on a stable unique column.
 *
 * Run with:
 *   npm run db:seed:admin
 */

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SUPER_ADMIN = { email: "orandsw@gmail.com", name: "Jimmy Saha" };

/** One seeded navigation item. `parentKey` refers to another item's `key`. */
type NavItemSeed = {
  key: string;
  label: string;
  path?: string;
  icon?: string;
  parentKey?: string;
  sortOrder: number;
  isDisabled?: boolean;
  isUniversal?: boolean;
};

// Navigation is data: adding a link means adding an entry here, never new logic.
// Parents precede their children — parentId is resolved from keys seeded earlier.
const NAV_ITEMS: NavItemSeed[] = [
  { key: "home", label: "Home", path: "/admin/home", icon: "Home", sortOrder: 0, isUniversal: true },
  { key: "acs", label: "ACS", sortOrder: 10 },
  { key: "acs.documents", label: "Documentation", path: "/admin/acs/documents", icon: "FileText", parentKey: "acs", sortOrder: 11 },
  { key: "acs.configuration", label: "Configuration", path: "/admin/acs/configuration", icon: "Settings", parentKey: "acs", sortOrder: 12, isDisabled: true },
];

/** Creates or refreshes the super admin, and returns the row. */
async function createSuperAdmin() {
  const admin = await prisma.adminUser.upsert({
    where: { email: SUPER_ADMIN.email },
    update: { name: SUPER_ADMIN.name, role: "SUPER_ADMIN", isActive: true },
    create: { email: SUPER_ADMIN.email, name: SUPER_ADMIN.name, role: "SUPER_ADMIN" },
  });

  console.log(`Super admin: ${admin.email} (${admin.id})`);

  return admin;
}

/** Creates or refreshes every nav item, and returns their ids keyed by `key`. */
async function createNavItems() {
  const navItemIdsByKey = new Map<string, string>();

  for (const seed of NAV_ITEMS) {
    const parentId = seed.parentKey ? navItemIdsByKey.get(seed.parentKey) : null;

    if (seed.parentKey && !parentId) {
      throw new Error(
        `Nav item "${seed.key}" lists parent "${seed.parentKey}", which is not seeded before it.`,
      );
    }

    const fields = {
      label: seed.label,
      path: seed.path ?? null,
      icon: seed.icon ?? null,
      parentId: parentId ?? null,
      sortOrder: seed.sortOrder,
      isDisabled: seed.isDisabled ?? false,
      isUniversal: seed.isUniversal ?? false,
    };

    const navItem = await prisma.adminNavItem.upsert({
      where: { key: seed.key },
      update: fields,
      create: { key: seed.key, ...fields },
    });

    navItemIdsByKey.set(seed.key, navItem.id);
    console.log(`Nav item: ${seed.key}`);
  }

  return navItemIdsByKey;
}

/**
 * Grants every non-universal nav item to the admin.
 *
 * Universal items reach all active admins without a grant row, so granting one
 * would make Home revocable by deleting that row.
 */
async function grantNavItemsToAdmin(adminUserId: string, navItemIdsByKey: Map<string, string>) {
  const grantableItems = NAV_ITEMS.filter((seed) => !seed.isUniversal);

  for (const seed of grantableItems) {
    const navItemId = navItemIdsByKey.get(seed.key)!;

    await prisma.adminUserNavItem.upsert({
      where: { adminUserId_navItemId: { adminUserId, navItemId } },
      update: {},
      create: { adminUserId, navItemId },
    });

    console.log(`Granted: ${seed.key}`);
  }
}

async function main() {
  const admin = await createSuperAdmin();
  const navItemIdsByKey = await createNavItems();

  await grantNavItemsToAdmin(admin.id, navItemIdsByKey);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
