import { prisma } from "../../config/prisma.js";
import type { DocumentStatus } from "../../generated/prisma/enums.js";

export type DocumentSortField = "createdAt" | "updatedAt" | "title" | "status";
export type SortDirection = "asc" | "desc";

/** Fields accepted when creating a document. */
export type CreateDocumentInput = {
  title: string;
  slug: string;
  description?: string;
  content?: string;
  status?: DocumentStatus;
  authorId: string;
};

/** Fields accepted when updating a document. The slug is fixed at creation. */
export type UpdateDocumentInput = {
  title?: string;
  description?: string;
  content?: string;
  status?: DocumentStatus;
};

/** Options for a paginated document listing. */
export type FindDocumentsOptions = {
  skip: number;
  take: number;
  sortBy: DocumentSortField;
  sortDirection: SortDirection;
  searchTerm?: string;
};

// Soft delete: nothing outside this file may touch deletedAt, and every read
// below narrows through it. A deleted document must read as absent.
const ACTIVE_DOCUMENT_FILTER = { deletedAt: null } as const;

const AUTHOR_SELECTION = { author: { select: { name: true, email: true } } } as const;

/**
 * Builds the `where` clause shared by the listing and its count, so the two can
 * never drift and report a total that does not match the rows.
 */
function buildActiveDocumentFilter(searchTerm?: string) {
  if (!searchTerm) return ACTIVE_DOCUMENT_FILTER;

  return {
    ...ACTIVE_DOCUMENT_FILTER,
    OR: [
      { title: { contains: searchTerm, mode: "insensitive" as const } },
      { slug: { contains: searchTerm, mode: "insensitive" as const } },
    ],
  };
}

/**
 * Prisma access for AdminDocument.
 *
 * The only layer permitted to read or write the `deletedAt` column. Every read
 * here excludes soft-deleted rows, so callers never have to remember to.
 */
export const DocumentRepository = {
  /** Returns one page of live documents, ordered by an already-validated field. */
  findDocuments(options: FindDocumentsOptions) {
    return prisma.adminDocument.findMany({
      where: buildActiveDocumentFilter(options.searchTerm),
      orderBy: { [options.sortBy]: options.sortDirection },
      skip: options.skip,
      take: options.take,
      include: AUTHOR_SELECTION,
    });
  },

  /** Counts live documents matching the same filter as `findDocuments`. */
  countDocuments(searchTerm?: string) {
    return prisma.adminDocument.count({ where: buildActiveDocumentFilter(searchTerm) });
  },

  /** Returns a live document, or null when it is missing or soft-deleted. */
  findDocumentById(documentId: string) {
    return prisma.adminDocument.findFirst({
      where: { id: documentId, ...ACTIVE_DOCUMENT_FILTER },
      include: AUTHOR_SELECTION,
    });
  },

  /** Backs slug-collision resolution: a soft-deleted row does not hold its slug. */
  findDocumentBySlug(slug: string) {
    return prisma.adminDocument.findFirst({
      where: { slug, ...ACTIVE_DOCUMENT_FILTER },
      select: { id: true },
    });
  },

  createDocument(input: CreateDocumentInput) {
    return prisma.adminDocument.create({ data: input });
  },

  /** Returns null when the document is missing or already deleted. */
  async updateDocument(documentId: string, input: UpdateDocumentInput) {
    // updateMany, so a deleted row is a miss rather than a Prisma throw.
    const { count } = await prisma.adminDocument.updateMany({
      where: { id: documentId, ...ACTIVE_DOCUMENT_FILTER },
      data: input,
    });

    return count === 0 ? null : DocumentRepository.findDocumentById(documentId);
  },

  /** Returns false when the document was already deleted. */
  async softDeleteDocument(documentId: string, deletedById: string) {
    // The active filter makes a second delete a no-op instead of overwriting the
    // original deletion timestamp.
    const { count } = await prisma.adminDocument.updateMany({
      where: { id: documentId, ...ACTIVE_DOCUMENT_FILTER },
      data: { deletedAt: new Date(), deletedById },
    });

    return count > 0;
  },
};
