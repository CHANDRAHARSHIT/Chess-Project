import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MatchmakingQueue } from "../MatchmakingQueue.js";

describe("MatchmakingQueue FCFS Pillar", () => {
  test("single enqueue creates WAITING ticket with UUID ticketId", () => {
    const queue = new MatchmakingQueue();
    const { ticket, descriptor } = queue.enqueue("user-1", "chess960");

    assert.equal(ticket.userId, "user-1");
    assert.equal(ticket.variantId, "chess960");
    assert.equal(ticket.status, "WAITING");
    assert.ok(typeof ticket.ticketId === "string" && ticket.ticketId.length > 20);
    assert.equal(descriptor, null);
  });

  test("enqueue is idempotent for active WAITING or MATCHED tickets", () => {
    const queue = new MatchmakingQueue();
    const { ticket: t1 } = queue.enqueue("user-1", "chess960");
    const { ticket: t2 } = queue.enqueue("user-1", "chess960");

    assert.equal(t1.ticketId, t2.ticketId);

    // Enqueue second user to form a match
    queue.enqueue("user-2", "chess960");

    // Check idempotency while MATCHED
    const { ticket: t3, descriptor } = queue.enqueue("user-1", "chess960");
    assert.equal(t3.ticketId, t1.ticketId);
    assert.equal(t3.status, "MATCHED");
    assert.notEqual(descriptor, null);
  });

  test("two users with same variantId pair into valid MatchDescriptor", () => {
    const queue = new MatchmakingQueue();
    const { descriptor: d1 } = queue.enqueue("user-1", "chess960");
    assert.equal(d1, null);

    const { descriptor: d2 } = queue.enqueue("user-2", "chess960");
    assert.notEqual(d2, null);
    assert.equal(d2!.variantId, "chess960");
    assert.equal(d2!.participants.length, 2);
    assert.equal(d2!.rated, false);
    assert.equal(d2!.provenance, "queue");
    assert.ok(typeof d2!.matchId === "string");

    // Check side assignment (0 and 1)
    const sides = d2!.participants.map((p) => p.side).sort();
    assert.deepEqual(sides, [0, 1]);
  });

  test("two users with different variantIds do NOT pair", () => {
    const queue = new MatchmakingQueue();
    queue.enqueue("user-1", "chess960");
    const { descriptor } = queue.enqueue("user-2", "standard");

    assert.equal(descriptor, null);
  });

  test("cancel deletes WAITING ticket from map upon authorization", () => {
    const queue = new MatchmakingQueue();
    const { ticket } = queue.enqueue("user-1", "chess960");

    // Wrong user cancel attempt
    assert.throws(
      () => queue.cancel(ticket.ticketId, "user-imposter"),
      /Unauthorized/
    );
    assert.notEqual(queue.getTicket(ticket.ticketId), undefined);

    // Correct user cancel
    queue.cancel(ticket.ticketId, "user-1");
    assert.equal(queue.getTicket(ticket.ticketId), undefined);
  });

  test("expireStale deletes expired tickets from map", async () => {
    const shortTtlQueue = new MatchmakingQueue(50); // 50ms TTL
    const { ticket } = shortTtlQueue.enqueue("user-1", "chess960");

    assert.notEqual(shortTtlQueue.getTicket(ticket.ticketId), undefined);

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 60));

    shortTtlQueue.expireStale();
    assert.equal(shortTtlQueue.getTicket(ticket.ticketId), undefined);
  });
});
