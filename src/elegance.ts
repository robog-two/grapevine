/**
 * From Stack Overflow, a more elegant way to loop for n times, inspired by the pythonic syntax.
 *
 * for (const i of range(5)) {}
 */
export function* range(start: number, stop: number | undefined = undefined, step = 1) {
  if (stop == undefined) {
    // The first parameter is implicitly stop if only one parameter is given.
    stop = start;
    start = 0;
  }

  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    yield i;
  }
}
