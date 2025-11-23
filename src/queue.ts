export interface Queue<E> {
  enqueue(item: E): void;
  dequeue(): E | undefined;
  size(): number;
  isEmpty(): boolean;
}
