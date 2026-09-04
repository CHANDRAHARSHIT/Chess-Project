import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyMap } from "../models/OdysseyMap.js";
import { ENodeType } from "../enums/ENodeType.js";
import { ENodeStatus } from "../enums/ENodeStatus.js";
import { makeGame } from "./factories.js";

describe("OdysseyMap", () => {
  test("test_generate_startsWithAStartNodeAtId0", () => {
    const map = OdysseyMap.generate("seed-a");
    assert.strictEqual(map.nodes[0].id, 0);
    assert.strictEqual(map.nodes[0].type, ENodeType.Start);
  });

  test("test_generate_endsWithABossNode", () => {
    const map = OdysseyMap.generate("seed-b");
    const last = map.nodes[map.nodes.length - 1];
    assert.strictEqual(last.type, ENodeType.Boss);
  });

  test("test_generate_producesNoTwoAdjacentRestrictedNodeTypes", () => {
    const map = OdysseyMap.generate("seed-c");
    const restricted = new Set([ENodeType.Rest, ENodeType.Elite, ENodeType.Merchant]);
    for (const node of map.nodes) {
      if (!restricted.has(node.type)) continue;
      for (const targetId of node.edges) {
        const target = map.getNode(targetId);
        if (target) {
          assert.strictEqual(restricted.has(target.type), false, `node ${node.id} (${node.type}) -> ${target.id} (${target.type})`);
        }
      }
    }
  });

  test("test_generate_isDeterministicForTheSameSeed", () => {
    const mapA = OdysseyMap.generate("same-seed");
    const mapB = OdysseyMap.generate("same-seed");
    assert.strictEqual(mapA.nodes.length, mapB.nodes.length);
    assert.deepStrictEqual(
      mapA.nodes.map(n => n.type),
      mapB.nodes.map(n => n.type)
    );
  });

  test("test_getNode_returnsUndefinedForUnknownId", () => {
    const map = OdysseyMap.generate("seed-d");
    assert.strictEqual(map.getNode(999999), undefined);
  });

  test("test_getNodeStatus_throwsForUnknownNodeId", () => {
    const map = OdysseyMap.generate("seed-e");
    const game = makeGame({ map });
    assert.throws(() => map.getNodeStatus(999999, game));
  });

  test("test_getNodeStatus_delegatesToNodeStatusFor", () => {
    const map = OdysseyMap.generate("seed-f");
    const game = makeGame({ map, completedNodes: [], currentNodeId: -1 });
    assert.strictEqual(map.getNodeStatus(0, game), ENodeStatus.Available);
  });
});
