export class RingQueue<T> {
    items: [T] | [] = [];
    startIndex: number = 0;
    endIndex: number = 0;

    /**
     * isEmpty
     */
    public isEmpty(): boolean {
        throw new Error("Not implemented");
    }

    /**
     * size
     */
    public size(): number {
        throw new Error("Not implemented");
    }

    /**
     * enqueue
     */
    public enqueue() {
        throw new Error("Not implemented");
    }

    /**
     * dequeue
     */
    public dequeue(): T {
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
