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

type NavSeed = {
  key: string;
  label: string;
  path?: string;
  icon?: string;
  parentKey?: string;
  sortOrder: number;
  isDisabled?: boolean;
  isUniversal?: boolean;
};

// Parents precede their children — parentId is resolved from keys seeded earlier.
const NAV_ITEMS: NavSeed[] = [
  { key: "home", label: "Home", path: "/admin/home", icon: "Home", sortOrder: 0, isUniversal: true },
  { key: "acs", label: "ACS", sortOrder: 10 },
  { key: "acs.documents", label: "Documentation", path: "/admin/acs/documents", icon: "FileText", parentKey: "acs", sortOrder: 11 },
  { key: "acs.configuration", label: "Configuration", path: "/admin/acs/configuration", icon: "Settings", parentKey: "acs", sortOrder: 12, isDisabled: true },
];

async function main() {
  const admin = await prisma.adminUser.upsert({
    where: { email: SUPER_ADMIN.email },
    update: { name: SUPER_ADMIN.name, role: "SUPER_ADMIN", isActive: true },
    create: { email: SUPER_ADMIN.email, name: SUPER_ADMIN.name, role: "SUPER_ADMIN" },
  });
  console.log(`Super admin: ${admin.email} (${admin.id})`);

  const idsByKey = new Map<string, string>();

  for (const item of NAV_ITEMS) {
    const parentId = item.parentKey ? idsByKey.get(item.parentKey) : null;
    if (item.parentKey && !parentId) {
      throw new Error(`Nav item "${item.key}" lists parent "${item.parentKey}", which is not seeded before it.`);
    }

    const fields = {
      label: item.label,
      path: item.path ?? null,
      icon: item.icon ?? null,
      parentId: parentId ?? null,
      sortOrder: item.sortOrder,
      isDisabled: item.isDisabled ?? false,
      isUniversal: item.isUniversal ?? false,
    };

    const navItem = await prisma.adminNavItem.upsert({
      where: { key: item.key },
      update: fields,
      create: { key: item.key, ...fields },
    });
    idsByKey.set(item.key, navItem.id);
    console.log(`Nav item: ${item.key}`);
  }

  // Universal items reach every active admin without a grant row, so granting one
  // would make Home revocable by deleting it.
  const grantable = NAV_ITEMS.filter((item) => !item.isUniversal);

  for (const item of grantable) {
    const navItemId = idsByKey.get(item.key)!;
    await prisma.adminUserNavItem.upsert({
      where: { adminUserId_navItemId: { adminUserId: admin.id, navItemId } },
      update: {},
      create: { adminUserId: admin.id, navItemId },
    });
    console.log(`Granted: ${item.key} -> ${admin.email}`);
  }
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
