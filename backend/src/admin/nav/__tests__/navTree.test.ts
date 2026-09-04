import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildNavTree, type NavRow } from "../nav.service.js";

function row(overrides: Partial<NavRow> & Pick<NavRow, "id" | "key">): NavRow {
  return {
    label: overrides.key,
    path: null,
    icon: null,
    parentId: null,
    isDisabled: false,
    isUniversal: false,
    grants: [],
    ...overrides,
  };
}

const granted = [{ id: "grant" }];

describe("buildNavTree", () => {
  it("keeps an ancestor heading of a granted link even when the heading is not granted", () => {
    const tree = buildNavTree([
      row({ id: "1", key: "acs" }),
      row({ id: "2", key: "acs.documents", path: "/admin/acs/documents", parentId: "1", grants: granted }),
    ]);

    assert.equal(tree.length, 1);
    assert.equal(tree[0].key, "acs");
    assert.deepEqual(
      tree[0].children.map((child) => child.key),
      ["acs.documents"],
    );
  });

  it("drops a granted heading that has no visible children", () => {
    const tree = buildNavTree([
      row({ id: "1", key: "acs", grants: granted }),
      row({ id: "2", key: "acs.documents", path: "/admin/acs/documents", parentId: "1" }),
    ]);

    assert.deepEqual(tree, []);
  });

  it("shows universal items without a grant and hides ungranted ones", () => {
    const tree = buildNavTree([
      row({ id: "1", key: "home", path: "/admin/home", isUniversal: true }),
      row({ id: "2", key: "secret", path: "/admin/secret" }),
    ]);

    assert.deepEqual(
      tree.map((item) => item.key),
      ["home"],
    );
  });
});
