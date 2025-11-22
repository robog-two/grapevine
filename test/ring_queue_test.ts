import { assert, assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { RingQueue } from "../src/ring_queue.ts";

describe("Ring Queue", () => {
  it("should report emptiness", () => {
    const rq = new RingQueue<string>();
    assert(rq.isEmpty);
    assertEquals(rq.size(), 0);
  });

  it("should accept an item", () => {
    const rq = new RingQueue<string>();

    rq.enqueue("Item One");
  });
});
