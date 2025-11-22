export class RingQueue<E> {
  items: [E | undefined] = new Array(10) as [undefined];
  startIndex: number = 0; // inclusive
  endIndex: number = 0; // exclusive
  __testing_disable_resize: boolean = false;

  /**
   * @returns true if there are no items in this queue
   */
  public isEmpty(): boolean {
    return this.endIndex == this.startIndex;
  }

  /**
   * @returns the number of items in this queue
   */
  public size(): number {
    if (this.endIndex >= this.startIndex) {
      return this.endIndex - this.startIndex;
    } else {
      return this.items.length - (this.startIndex - this.endIndex);
    }
  }

  /**
   * @param item An item which will be added to the queue
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
   * @returns The first item that was enqueued, or undefined if the queue is empty
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
   * Removes all items from the queue, afterwards size() == 0 and isEmpty() == true
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
