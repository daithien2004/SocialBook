export interface ICacheService {
    /**
     * Lấy giá trị từ cache theo key.
     * Trả về null nếu không tồn tại hoặc đã hết hạn.
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Lưu giá trị vào cache.
     * ttlSeconds - Thời gian sống (giây). Không truyền → tồn tại mãi mãi.
     */
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

    /**
     * Xóa một key khỏi cache.
     */
    del(key: string): Promise<void>;

    /**
     * Xóa hàng loạt key theo glob pattern.
     * Ví dụ: clear('posts:*') → xóa posts:1, posts:2, posts:trending, ...
     */
    clear(pattern: string): Promise<void>;

    /**
     * Cache-Aside: Đọc cache, nếu miss thì gọi factory() lấy data → lưu cache → trả về.
     */
    wrap<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T>;
}

// DI token để inject ICacheService trong NestJS
export const CACHE_SERVICE = Symbol('ICacheService');