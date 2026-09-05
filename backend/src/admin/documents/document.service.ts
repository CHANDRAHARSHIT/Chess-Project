import {
  DocumentRepository,
  type DocumentSortField,
  type SortDirection,
} from "./document.repository.js";
import type { DocumentStatus } from "../../generated/prisma/enums.js";
import type { CustomError } from "../../middleware/error.middleware.js";

const SORTABLE_FIELDS: DocumentSortField[] = ["createdAt", "updatedAt", "title", "status"];
const DOCUMENT_STATUSES: DocumentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const DEFAULT_PAGE_SIZE = 20;
const MINIMUM_PAGE_SIZE = 1;
const MAXIMUM_PAGE_SIZE = 100;
const MAXIMUM_TITLE_LENGTH = 200;
const MAXIMUM_DESCRIPTION_LENGTH = 500;
const DEFAULT_SLUG = "document";

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;

/** Validated list parameters, safe to hand to the repository. */
export type DocumentListQuery = {
  limit: number;
  offset: number;
  sortBy: DocumentSortField;
  sortDirection: SortDirection;
  searchTerm?: string;
};

/** Builds an error the shared error middleware will render with the given status. */
function createHttpError(message: string, statusCode: number): CustomError {
  return Object.assign(new Error(message), { statusCode });
}

/** Converts a title into a URL-safe slug. */
function convertTitleToSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Appends -2, -3, … until the slug is free among live documents.
 *
 * Soft-deleted rows release their slug, so a reused title can reclaim the
 * original — see the partial unique index in the admin domain migration.
 */
async function buildUniqueSlug(title: string) {
  const baseSlug = convertTitleToSlug(title) || DEFAULT_SLUG;

  for (let suffix = 1; ; suffix++) {
    const candidateSlug = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;
    const isTaken = await DocumentRepository.findDocumentBySlug(candidateSlug);

    if (!isTaken) return candidateSlug;
  }
}

/** Returns the trimmed title, or throws a 400 when it is missing or too long. */
function validateTitle(value: unknown) {
  const title = typeof value === "string" ? value.trim() : "";

  if (!title || title.length > MAXIMUM_TITLE_LENGTH) {
    throw createHttpError(
      `Title is required and must be at most ${MAXIMUM_TITLE_LENGTH} characters.`,
      HTTP_BAD_REQUEST,
    );
  }

  return title;
}

/** Returns the status, or throws a 400 when it is not a known value. */
function validateStatus(value: unknown) {
  if (value === undefined) return undefined;

  if (!DOCUMENT_STATUSES.includes(value as DocumentStatus)) {
    throw createHttpError(
      `Status must be one of ${DOCUMENT_STATUSES.join(", ")}.`,
      HTTP_BAD_REQUEST,
    );
  }

  return value as DocumentStatus;
}

/** Returns the trimmed description, or throws a 400 when it is too long. */
function validateDescription(value: unknown) {
  if (value === undefined) return undefined;

  const description = typeof value === "string" ? value.trim() : "";

  if (description.length > MAXIMUM_DESCRIPTION_LENGTH) {
    throw createHttpError(
      `Description must be at most ${MAXIMUM_DESCRIPTION_LENGTH} characters.`,
      HTTP_BAD_REQUEST,
    );
  }

  return description;
}

/** Returns the content when it is a string, otherwise leaves it unchanged. */
function validateContent(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

/** Clamps a requested page size into the allowed window. */
function calculatePageSize(value: unknown) {
  const requestedSize = Number(value);

  if (!Number.isFinite(requestedSize)) return DEFAULT_PAGE_SIZE;

  return Math.min(Math.max(Math.trunc(requestedSize), MINIMUM_PAGE_SIZE), MAXIMUM_PAGE_SIZE);
}

/** Clamps a requested offset to zero or greater. */
function calculateOffset(value: unknown) {
  const requestedOffset = Number(value);

  return Number.isFinite(requestedOffset) ? Math.max(Math.trunc(requestedOffset), 0) : 0;
}

/**
 * Clamps and whitelists untrusted list parameters before they reach Prisma.
 *
 * `sortBy` is whitelisted rather than passed through because the field name
 * reaches Prisma's `orderBy` directly.
 */
export function parseListQuery(query: Record<string, unknown>): DocumentListQuery {
  const requestedSortBy = query.sortBy as DocumentSortField;
  const searchTerm =
    typeof query.searchTerm === "string" && query.searchTerm.trim()
      ? query.searchTerm.trim()
      : undefined;

  return {
    limit: calculatePageSize(query.limit),
    offset: calculateOffset(query.offset),
    sortBy: SORTABLE_FIELDS.includes(requestedSortBy) ? requestedSortBy : "createdAt",
    sortDirection: query.sortDirection === "asc" ? "asc" : "desc",
    searchTerm,
  };
}

/**
 * Business rules for admin documents: validation, pagination and slug policy.
 *
 * Sits between DocumentController (HTTP) and DocumentRepository (Prisma). Holds
 * no request or response objects, and throws errors carrying a statusCode for
 * the shared error middleware to render.
 */
export class DocumentService {
  /** Returns one validated page of live documents plus the total that matched. */
  static async getDocuments(query: Record<string, unknown>) {
    const { limit, offset, sortBy, sortDirection, searchTerm } = parseListQuery(query);

    const [items, total] = await Promise.all([
      DocumentRepository.findDocuments({ skip: offset, take: limit, sortBy, sortDirection, searchTerm }),
      DocumentRepository.countDocuments(searchTerm),
    ]);

    return { items, total, limit, offset };
  }

  /** Throws a 404 when the document is missing or soft-deleted. */
  static async getDocumentById(documentId: string) {
    const document = await DocumentRepository.findDocumentById(documentId);

    if (!document) throw createHttpError("Document not found.", HTTP_NOT_FOUND);

    return document;
  }

  static async createDocument(body: Record<string, unknown>, authorId: string) {
    const title = validateTitle(body.title);

    return DocumentRepository.createDocument({
      title,
      slug: await buildUniqueSlug(title),
      description: validateDescription(body.description),
      content: validateContent(body.content),
      status: validateStatus(body.status),
      authorId,
    });
  }

  /**
   * Applies a partial update. The slug is deliberately not regenerated from a new
   * title — retitling a document must not break every existing link to it.
   */
  static async updateDocument(documentId: string, body: Record<string, unknown>) {
    const document = await DocumentRepository.updateDocument(documentId, {
      title: body.title === undefined ? undefined : validateTitle(body.title),
      description: validateDescription(body.description),
      content: validateContent(body.content),
      status: validateStatus(body.status),
    });

    if (!document) throw createHttpError("Document not found.", HTTP_NOT_FOUND);

    return document;
  }

  /** Soft-deletes a document. Throws a 404 when it is already gone. */
  static async deleteDocument(documentId: string, deletedById: string) {
    const wasDeleted = await DocumentRepository.softDeleteDocument(documentId, deletedById);

    if (!wasDeleted) throw createHttpError("Document not found.", HTTP_NOT_FOUND);
  }
}
