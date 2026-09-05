import { prisma } from "../../config/prisma.js";

/**
 * Prisma access for AdminNavItem.
 *
 * Fetches every nav item with one admin's grant rows attached. The table holds a
 * handful of rows, so filtering and tree assembly happen in NavService rather
 * than in SQL — an ancestor of a granted link must survive the filter even when
 * the ancestor itself was never granted, which a flat WHERE cannot express.
 */
export function findNavItemsWithGrants(adminUserId: string) {
  return prisma.adminNavItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    include: { grants: { where: { adminUserId }, select: { id: true } } },
  });
}
