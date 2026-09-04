import { prisma } from "../../config/prisma.js";
import type { DocumentStatus } from "../../generated/prisma/enums.js";

export type SortField = "createdAt" | "updatedAt" | "title" | "status";
export type SortDir = "asc" | "desc";

// Soft delete: nothing outside this file may touch deletedAt, and every read
// below narrows through it. A document that is deleted must read as absent.
const ACTIVE = { deletedAt: null } as const;

function whereActive(search?: string) {
  if (!search) return ACTIVE;
  return {
    ...ACTIVE,
    OR: [
      { title: { contains: search, mode: "insensitive" as const } },
      { slug: { contains: search, mode: "insensitive" as const } },
    ],
  };
}

export const DocumentRepository = {
  findMany(params: { skip: number; take: number; sortBy: SortField; sortDir: SortDir; search?: string }) {
    return prisma.adminDocument.findMany({
      where: whereActive(params.search),
      orderBy: { [params.sortBy]: params.sortDir },
      skip: params.skip,
      take: params.take,
      include: { author: { select: { name: true, email: true } } },
    });
  },

  count(search?: string) {
    return prisma.adminDocument.count({ where: whereActive(search) });
  },

  findById(id: string) {
    return prisma.adminDocument.findFirst({
      where: { id, ...ACTIVE },
      include: { author: { select: { name: true, email: true } } },
    });
  },

  findBySlug(slug: string) {
    return prisma.adminDocument.findFirst({ where: { slug, ...ACTIVE }, select: { id: true } });
  },

  create(data: { title: string; slug: string; description?: string; content?: string; status?: DocumentStatus; authorId: string }) {
    return prisma.adminDocument.create({ data });
  },

  async update(id: string, data: { title?: string; description?: string; content?: string; status?: DocumentStatus }) {
    // updateMany so a deleted row is a miss rather than a Prisma throw.
    const { count } = await prisma.adminDocument.updateMany({ where: { id, ...ACTIVE }, data });
    return count === 0 ? null : DocumentRepository.findById(id);
  },

  async softDelete(id: string, deletedById: string) {
    // The ACTIVE predicate makes a second delete a no-op instead of overwriting
    // the original deletion timestamp.
    const { count } = await prisma.adminDocument.updateMany({
      where: { id, ...ACTIVE },
      data: { deletedAt: new Date(), deletedById },
    });
    return count > 0;
  },
};
