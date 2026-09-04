import { prisma } from "../../config/prisma.js";

/**
 * Fetches every nav item with this admin's grant rows attached. The table holds
 * a handful of rows, so filtering and tree assembly happen in the service
 * rather than in SQL — ancestors of a granted link must survive the filter even
 * when the ancestor itself was never granted.
 */
export async function findAllWithGrants(adminUserId: string) {
  return prisma.adminNavItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    include: { grants: { where: { adminUserId }, select: { id: true } } },
  });
}
