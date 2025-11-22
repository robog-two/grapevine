import { assert, assertEquals, assertFalse } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { RingQueue } from "../src/ring_queue.ts";
import { range } from "../src/elegance.ts";

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

  it("should return an item when not empty", () => {
    const rq = new RingQueue<string>();
    assertEquals(rq.dequeue(), undefined);
    rq.enqueue("Item One");
    assertFalse(rq.isEmpty());
    assertEquals(rq.dequeue(), "Item One");
  });

  it("should operate in FIFO order", () => {
    const rq = new RingQueue<number>();
    const n = 30;

    for (const i of range(n)) {
      rq.enqueue(i);
    }

    assertEquals(
      range(n).map((_) => rq.dequeue()).toArray(),
      range(n).toArray(),
    );
  });

  it("should wrap around without resizing", () => {
    const rq = new RingQueue<number>();
    rq.__testing_disable_resize = true;

    for (const i of range(30)) {
      rq.enqueue(i);
      assert(rq.dequeue() == i);
    }
  });

  it("should report size properly", () => {
    const rq = new RingQueue<number>();
    rq.__testing_disable_resize = true; // keep inital size of 10 to ensure wrap-around

    // This accounts for wrap-arounds
    for (const targetSize of range(1, 10)) {
      for (const i of range(1, targetSize + 1)) {
        rq.enqueue(i);
        assertEquals(rq.size(), i);
      }
      for (const i of range(1, targetSize + 1)) {
        rq.dequeue();
        assertEquals(rq.size(), targetSize - i);
      }
    }
  });
});
