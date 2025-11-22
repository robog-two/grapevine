import { assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { RingQueue } from "../src/ring_queue.ts";

describe("Ring Queue", () => {
  describe("When the queue is empty", () => {
    it("should report emptiness", () => {
        const rq = new RingQueue<string>();
        assert(rq.isEmpty());
        assert(rq.size() == 0);
    });
  });
});
