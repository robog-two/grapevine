import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert/equals";
import { range } from "../src/elegance.ts";
import { assertThrows } from "@std/assert/throws";

describe("range() function", () => {
  it("should create values in a range (0, n]", () => {
    assertEquals(range(1).toArray(), [0]);
    assertEquals(range(2).toArray(), [0, 1]);
    assertEquals(range(3).toArray(), [0, 1, 2]);
    assertEquals(range(4).toArray(), [0, 1, 2, 3]);
  });

  it("should create values in a range (n, n]", () => {
    assertEquals(range(3, 4).toArray(), [3]);
    assertEquals(range(3, 5).toArray(), [3, 4]);
    assertEquals(range(3, 6).toArray(), [3, 4, 5]);
    assertEquals(range(3, 7).toArray(), [3, 4, 5, 6]);
  });

  it("should create values with steps", () => {
    assertEquals(range(2, 5, 2).toArray(), [2, 4]);
    assertEquals(range(2, 6, 3).toArray(), [2, 5]);
    assertEquals(range(0, 15, 5).toArray(), [0, 5, 10]);
  });

  it("should be able to count backwards", () => {
    assertEquals(range(5, 0, -1).toArray(), [5, 4, 3, 2, 1]);
    assertEquals(range(8, -1, -2).toArray(), [8, 6, 4, 2, 0]);
  });

  it("should error on invalid/infinite ranges", () => {
    assertThrows(() => range(0).toArray());
    assertThrows(() => range(3, 3).toArray());
    assertThrows(() => range(-10).toArray());
    assertThrows(() => range(0, 9, -1).toArray());
    assertThrows(() => range(10, 0, 1).toArray());
  });
});
