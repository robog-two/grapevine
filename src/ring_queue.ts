export class RingQueue<E> {
  items: [E | undefined] = new Array(10) as [undefined];
  startIndex: number = 0; // inclusive
  endIndex: number = 0; // exclusive

  /**
   * isEmpty
   */
  public isEmpty(): boolean {
    return this.size() == 0;
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
    throw new Error("Not implemented");
  }

  /**
   * dequeue
   */
  public dequeue(): E {
    throw new Error("Not implemented");
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
