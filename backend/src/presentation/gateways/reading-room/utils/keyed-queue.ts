export class KeyedQueue {
  private readonly queues = new Map<string, Promise<unknown>>();

  /**
   * Đưa một task vào hàng đợi để thực thi tuần tự theo khóa (key).
   * Phù hợp để khóa (mutex) các thao tác bất đồng bộ của cùng một user/room
   * nhằm tránh race condition khi gọi join/leave liên tiếp.
   */
  async enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
    const currentPromise = this.queues.get(key) || Promise.resolve();

    // Luôn bọc lại để đảm bảo task chạy dù task trước đó fail hay success
    const nextPromise = currentPromise.catch(() => {}).then(() => task());

    this.queues.set(key, nextPromise);

    try {
      return await nextPromise;
    } finally {
      // Dọn dẹp key khỏi Map nếu không còn ai enqueue thêm sau task này
      if (this.queues.get(key) === nextPromise) {
        this.queues.delete(key);
      }
    }
  }
}
