import { findNavItemsWithGrants } from "./nav.repository.js";

/** A navigation node as sent to the admin client. */
export type NavItemDto = {
  id: string;
  key: string;
  label: string;
  path: string | null;
  icon: string | null;
  isDisabled: boolean;
  children: NavItemDto[];
};

/** A nav row with this admin's grant rows attached, pre-sorted by the repository. */
export type NavRow = {
  id: string;
  key: string;
  label: string;
  path: string | null;
  icon: string | null;
  parentId: string | null;
  isDisabled: boolean;
  isUniversal: boolean;
  grants: { id: string }[];
};

/** A row with no path is a section heading rather than a link. */
function isHeading(item: NavItemDto) {
  return item.path === null;
}

/** Universal items reach every active admin; everything else needs a grant row. */
function canAdminSeeRow(row: NavRow) {
  return row.isUniversal || row.grants.length > 0;
}

/**
 * Collects the ids the admin may see: directly visible rows, plus every ancestor
 * heading of one.
 *
 * Ancestors are pulled in even when ungranted, so revoking a heading's grant
 * cannot orphan a link the admin is still entitled to.
 */
function collectVisibleIds(rows: NavRow[]) {
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const visibleIds = new Set<string>();

  for (const row of rows) {
    if (!canAdminSeeRow(row)) continue;

    visibleIds.add(row.id);

    for (let ancestorId = row.parentId; ancestorId; ) {
      if (visibleIds.has(ancestorId)) break;

      visibleIds.add(ancestorId);
      ancestorId = rowsById.get(ancestorId)?.parentId ?? null;
    }
  }

  return visibleIds;
}

/** Converts the visible rows into detached nodes, keyed by id. */
function createNodesById(rows: NavRow[], visibleIds: Set<string>) {
  const nodesById = new Map<string, NavItemDto>();

  for (const row of rows) {
    if (!visibleIds.has(row.id)) continue;

    nodesById.set(row.id, {
      id: row.id,
      key: row.key,
      label: row.label,
      path: row.path,
      icon: row.icon,
      isDisabled: row.isDisabled,
      children: [],
    });
  }

  return nodesById;
}

/** Links each node to its parent and returns the roots, preserving row order. */
function buildRootNodes(rows: NavRow[], nodesById: Map<string, NavItemDto>) {
  const rootNodes: NavItemDto[] = [];

  for (const row of rows) {
    const node = nodesById.get(row.id);
    if (!node) continue;

    const parentNode = row.parentId ? nodesById.get(row.parentId) : undefined;

    if (parentNode) parentNode.children.push(node);
    else rootNodes.push(node);
  }

  return rootNodes;
}

/**
 * Drops headings with nothing under them, at any depth.
 *
 * A heading can reach this point empty by being granted directly rather than
 * pulled in as an ancestor.
 */
function removeEmptyHeadings(items: NavItemDto[]): NavItemDto[] {
  return items
    .map((item) => ({ ...item, children: removeEmptyHeadings(item.children) }))
    .filter((item) => !isHeading(item) || item.children.length > 0);
}

/**
 * Resolves the navigation tree a given admin may see, from pre-sorted rows.
 *
 * Reads as the four steps it performs: decide what is visible, create the nodes,
 * link them into a tree, then drop headings left empty.
 */
export function buildNavTree(rows: NavRow[]): NavItemDto[] {
  const visibleIds = collectVisibleIds(rows);
  const nodesById = createNodesById(rows, visibleIds);
  const rootNodes = buildRootNodes(rows, nodesById);

  return removeEmptyHeadings(rootNodes);
}

/**
 * Navigation rules for the admin sidebar.
 *
 * Navigation is data, not code: items and their per-admin grants live in
 * AdminNavItem and AdminUserNavItem, so adding a link is a row rather than a
 * change here.
 */
export class NavService {
  /** Returns the navigation tree for one admin. */
  static async getNavForAdmin(adminUserId: string): Promise<NavItemDto[]> {
    return buildNavTree(await findNavItemsWithGrants(adminUserId));
  }
}
