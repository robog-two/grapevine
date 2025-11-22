export class RingQueue<E> {
  items: [E | undefined] = new Array(10) as [undefined];
  startIndex: number = 0; // inclusive
  endIndex: number = 0; // exclusive

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
      throw new Error("Not implemented");
    }

    this.items[this.endIndex] = item;
    this.endIndex++;
  }

  /**
   * dequeue
   */
  public dequeue(): E | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    this.endIndex--; // Remember, this is exclusive.
    return this.items[this.endIndex];
  }

  /**
   * clear
   */
  public clear() {
    throw new Error("Not implemented");
  }

  private doubleSizeIfFull(): boolean {
    throw new Error("Not implemented");
  }
}
