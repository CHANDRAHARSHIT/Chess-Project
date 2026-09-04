import { DocumentRepository, type SortDir, type SortField } from "./document.repository.js";
import type { DocumentStatus } from "../../generated/prisma/enums.js";
import type { CustomError } from "../../middleware/error.middleware.js";

const SORT_FIELDS: SortField[] = ["createdAt", "updatedAt", "title", "status"];
const STATUSES: DocumentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

function fail(message: string, statusCode: number): CustomError {
  return Object.assign(new Error(message), { statusCode });
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Appends -2, -3, … until the slug is free among live documents. */
async function uniqueSlug(title: string) {
  const base = slugify(title) || "document";
  for (let suffix = 1; ; suffix++) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    if (!(await DocumentRepository.findBySlug(candidate))) return candidate;
  }
}

function cleanTitle(value: unknown) {
  const title = typeof value === "string" ? value.trim() : "";
  if (!title || title.length > 200) throw fail("Title is required and must be at most 200 characters.", 400);
  return title;
}

function cleanStatus(value: unknown) {
  if (value === undefined) return undefined;
  if (!STATUSES.includes(value as DocumentStatus)) throw fail(`Status must be one of ${STATUSES.join(", ")}.`, 400);
  return value as DocumentStatus;
}

function cleanDescription(value: unknown) {
  if (value === undefined) return undefined;
  const description = typeof value === "string" ? value.trim() : "";
  if (description.length > 500) throw fail("Description must be at most 500 characters.", 400);
  return description;
}

/** Clamps and whitelists untrusted list parameters before they reach Prisma. */
export function parseListQuery(query: Record<string, unknown>) {
  const rawLimit = Number(query.limit);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT) : DEFAULT_LIMIT;

  const rawOffset = Number(query.offset);
  const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;

  // Whitelisted, not passed through: sortBy reaches Prisma's orderBy.
  const sortBy: SortField = SORT_FIELDS.includes(query.sortBy as SortField)
    ? (query.sortBy as SortField)
    : "createdAt";
  const sortDir: SortDir = query.sortDir === "asc" ? "asc" : "desc";
  const search = typeof query.search === "string" && query.search.trim() ? query.search.trim() : undefined;

  return { limit, offset, sortBy, sortDir, search };
}

export class DocumentService {
  static async list(query: Record<string, unknown>) {
    const { limit, offset, sortBy, sortDir, search } = parseListQuery(query);

    const [items, total] = await Promise.all([
      DocumentRepository.findMany({ skip: offset, take: limit, sortBy, sortDir, search }),
      DocumentRepository.count(search),
    ]);

    return { items, total, limit, offset };
  }

  static async getById(id: string) {
    const document = await DocumentRepository.findById(id);
    if (!document) throw fail("Document not found.", 404);
    return document;
  }

  static async create(body: Record<string, unknown>, authorId: string) {
    const title = cleanTitle(body.title);

    return DocumentRepository.create({
      title,
      slug: await uniqueSlug(title),
      description: cleanDescription(body.description),
      content: typeof body.content === "string" ? body.content : undefined,
      status: cleanStatus(body.status),
      authorId,
    });
  }

  // The slug is fixed at creation. Retitling a document must not silently break
  // every link to it.
  static async update(id: string, body: Record<string, unknown>) {
    const document = await DocumentRepository.update(id, {
      title: body.title === undefined ? undefined : cleanTitle(body.title),
      description: cleanDescription(body.description),
      content: typeof body.content === "string" ? body.content : undefined,
      status: cleanStatus(body.status),
    });

    if (!document) throw fail("Document not found.", 404);
    return document;
  }

  static async remove(id: string, deletedById: string) {
    if (!(await DocumentRepository.softDelete(id, deletedById))) throw fail("Document not found.", 404);
  }
}
