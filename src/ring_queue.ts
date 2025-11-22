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
    if (this.endIndex >= this.startIndex) {
      return this.endIndex - this.startIndex;
    } else {
      return this.items.length - (this.startIndex - this.endIndex);
    }
  }

  /**
   * enqueue
   */
  public enqueue(item: E) {
    this.doubleSizeIfFull();

    this.items[this.endIndex] = item;
    this.endIndex++; // Remember, this is EXclusive

    if (this.endIndex == this.items.length) {
      this.endIndex = 0;
    }
  }

  /**
   * dequeue
   */
  public dequeue(): E | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const item = this.items[this.startIndex];

    // Not strictly necessary but may offer security benefits
    this.items[this.startIndex] = undefined;

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

  private doubleSizeIfFull() {
    if (this.size() == this.items.length - 1) {
      if (this.__testing_disable_resize) {
        throw new Error("Resized when not allowed");
      }

      const newItems = new Array(this.items.length * 2) as [E | undefined];
      const originalSize = this.size();

      for (let i = 0; i < originalSize; i++) {
        newItems[i] = this.dequeue();
      }

      this.items = newItems;
      this.startIndex = 0;
      this.endIndex = originalSize;
      return true;
    } else {
      return false;
    }
  }
}
