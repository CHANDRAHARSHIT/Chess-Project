import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyNode } from "../../models/OdysseyNode.js";
import { OdysseyMap } from "../../models/OdysseyMap.js";
import { ENodeType } from "../../enums/ENodeType.js";
import { ENodeStatus } from "../../enums/ENodeStatus.js";
import { makeGame } from "../support/factories.js";

function makeNode(id: number, edges: number[] = []): OdysseyNode {
  return new OdysseyNode(id, ENodeType.Enemy, `Node ${id}`, 0, 0, edges, "test");
}

describe("OdysseyNode", () => {
  test("test_isAdjacentTo_returnsTrueWhenNodeIdIsInEdges", () => {
    const node = makeNode(1, [2, 3]);
    assert.strictEqual(node.isAdjacentTo(2), true);
  });

  test("test_isAdjacentTo_returnsFalseWhenNodeIdIsNotInEdges", () => {
    const node = makeNode(1, [2, 3]);
    assert.strictEqual(node.isAdjacentTo(4), false);
  });

  test("test_isBoss_returnsTrueForBossTypeNode", () => {
    const node = new OdysseyNode(1, ENodeType.Boss, "Boss", 0, 0, [], "test");
    assert.strictEqual(node.isBoss(), true);
  });

  test("test_isBoss_returnsFalseForNonBossTypeNode", () => {
    const node = makeNode(1);
    assert.strictEqual(node.isBoss(), false);
  });

  test("test_statusFor_returnsCompletedWhenNodeIdInCompletedNodes", () => {
    const node = makeNode(5);
    const game = makeGame({ completedNodes: [5] });
    assert.strictEqual(node.statusFor(game), ENodeStatus.Completed);
  });

  test("test_statusFor_returnsAvailableForStartNodeWhenNothingCompletedYet", () => {
    const node = makeNode(0);
    const game = makeGame({ completedNodes: [], currentNodeId: -1 });
    assert.strictEqual(node.statusFor(game), ENodeStatus.Available);
  });

  test("test_statusFor_returnsActiveForStartNodeWhenItIsCurrentNode", () => {
    const node = makeNode(0);
    const game = makeGame({ completedNodes: [], currentNodeId: 0 });
    assert.strictEqual(node.statusFor(game), ENodeStatus.Active);
  });

  test("test_statusFor_returnsLockedForNonStartNodeWhenNothingCompletedYet", () => {
    const node = makeNode(3);
    const game = makeGame({ completedNodes: [], currentNodeId: -1 });
    assert.strictEqual(node.statusFor(game), ENodeStatus.Locked);
  });

  test("test_statusFor_returnsActiveWhenNodeIsCurrentNode", () => {
    const node = makeNode(4);
    const game = makeGame({ completedNodes: [0], currentNodeId: 4 });
    assert.strictEqual(node.statusFor(game), ENodeStatus.Active);
  });

  test("test_statusFor_returnsAvailableWhenAdjacentToCompletedCurrentNode", () => {
    const start = makeNode(0, [1]);
    const target = makeNode(1);
    const game = makeGame({ map: new OdysseyMap([start, target]), completedNodes: [0], currentNodeId: 0 });
    assert.strictEqual(target.statusFor(game), ENodeStatus.Available);
  });

  test("test_statusFor_returnsLockedWhenNotAdjacentToCompletedCurrentNode", () => {
    const start = makeNode(0, [1]);
    const target = makeNode(2);
    const game = makeGame({ map: new OdysseyMap([start, makeNode(1), target]), completedNodes: [0], currentNodeId: 0 });
    assert.strictEqual(target.statusFor(game), ENodeStatus.Locked);
  });
});
