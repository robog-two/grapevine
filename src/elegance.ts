import { assert } from "@std/assert/assert";

/**
 * From Stack Overflow, a more elegant way to loop for n times, inspired by the pythonic syntax.
 *
 * for (const i of range(5)) { console.log(i) } // 0, 1, 2, 3, 4
 *
 * @param start Start of range, inclusive; will be end of range if only one parameter is provided
 * @param stop End of range, exclusive
 * @param step Will go from start to stop in steps of size step, may be negative if stop < start
 */
export function* range(start: number, stop: number | undefined = undefined, step = 1) {
  if (stop == undefined) {
    // The first parameter is implicitly stop if only one parameter is given.
    stop = start;
    start = 0;
  }

  if (step > 0) {
    assert(stop > start);
    // Counting forward
    for (let i = start; i < stop; i += step) {
      yield i;
    }
  } else {
    assert(stop < start);
    // Counting backward
    for (let i = start; i > stop; i += step) {
      yield i;
    }
  }
}
