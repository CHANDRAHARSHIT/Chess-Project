import { findAllWithGrants } from "./nav.repository.js";

export type NavItemDto = {
  id: string;
  key: string;
  label: string;
  path: string | null;
  icon: string | null;
  isDisabled: boolean;
  children: NavItemDto[];
};

export class NavService {
  /**
   * Resolves the nav tree a given admin may see.
   *
   * Universal items reach everyone; the rest need a grant. A granted link also
   * pulls in its ancestor headings, so a missing heading grant cannot orphan a
   * link the admin is entitled to. Headings left with nothing under them are
   * dropped rather than rendered empty.
   */
  static async getNavForAdmin(adminUserId: string): Promise<NavItemDto[]> {
    const rows = await findAllWithGrants(adminUserId);
    const byId = new Map(rows.map((row) => [row.id, row]));

    const visibleIds = new Set<string>();
    for (const row of rows) {
      if (!row.isUniversal && row.grants.length === 0) continue;

      visibleIds.add(row.id);
      for (let parentId = row.parentId; parentId; ) {
        if (visibleIds.has(parentId)) break;
        visibleIds.add(parentId);
        parentId = byId.get(parentId)?.parentId ?? null;
      }
    }

    const nodes = new Map<string, NavItemDto>();
    for (const row of rows) {
      if (!visibleIds.has(row.id)) continue;
      nodes.set(row.id, {
        id: row.id,
        key: row.key,
        label: row.label,
        path: row.path,
        icon: row.icon,
        isDisabled: row.isDisabled,
        children: [],
      });
    }

    const roots: NavItemDto[] = [];
    // rows are pre-sorted, so pushing in order keeps siblings ordered.
    for (const row of rows) {
      const node = nodes.get(row.id);
      if (!node) continue;

      const parent = row.parentId ? nodes.get(row.parentId) : undefined;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }

    return pruneEmptyHeadings(roots);
  }
}

// A heading is a row with no path. One can survive the visibility pass while
// empty — by being granted directly rather than pulled in as an ancestor.
function pruneEmptyHeadings(items: NavItemDto[]): NavItemDto[] {
  return items
    .map((item) => ({ ...item, children: pruneEmptyHeadings(item.children) }))
    .filter((item) => item.path !== null || item.children.length > 0);
}
