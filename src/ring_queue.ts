export class RingQueue<E> {
  items: [E | undefined] = new Array(10) as [undefined];
  startIndex: number = 0; // inclusive
  endIndex: number = 0; // exclusive
  __testing_disable_resize: boolean = false;

  /**
   * isEmpty
   */
  public isEmpty(): boolean {
    return this.endIndex == this.startIndex;
  }

  /**
   * size
   */
  public size(): number {
    if (this.startIndex >= this.endIndex) {
      return this.endIndex - this.startIndex;
    } else {
      return this.items.length - (this.startIndex - this.endIndex);
    }
  }

  /**
   * enqueue
   */
  public enqueue(item: E) {
    if (this.endIndex == this.items.length) {
      this.endIndex = 0;
    }

    this.items[this.endIndex] = item;
    this.endIndex++; // Remember, this is EXclusive
  }

  /**
   * dequeue
   */
  public dequeue(): E | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const item = this.items[this.startIndex];

    this.startIndex++; // Remember, this is INclusive.
    if (this.startIndex == this.items.length) {
      this.startIndex = 0;
    }

    return item;
  }

  /**
   * clear
   */
  public clear() {
    throw new Error("Not implemented");
  }

  private doubleSizeIfFull(): boolean {
    if (this.__testing_disable_resize) {
      throw new Error("Resized when not allowed");
    }
    return false;
  }
}
