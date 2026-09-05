import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseListQuery } from "../document.service.js";

describe("parseListQuery", () => {
  it("clamps limit to 1..100 and offset to non-negative", () => {
    assert.equal(parseListQuery({ limit: "9999" }).limit, 100);
    assert.equal(parseListQuery({ limit: "0" }).limit, 1);
    assert.equal(parseListQuery({ limit: "abc" }).limit, 20);
    assert.equal(parseListQuery({ offset: "-5" }).offset, 0);
  });

  it("falls back to createdAt desc for a sortBy outside the whitelist", () => {
    // sortBy reaches Prisma's orderBy, so an unrecognised value must never pass through.
    assert.deepEqual(parseListQuery({ sortBy: "id; DROP TABLE", sortDirection: "sideways" }), {
      limit: 20,
      offset: 0,
      sortBy: "createdAt",
      sortDirection: "desc",
      searchTerm: undefined,
    });

    assert.equal(parseListQuery({ sortBy: "title", sortDirection: "asc" }).sortBy, "title");
  });
});
