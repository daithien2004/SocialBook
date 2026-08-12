export abstract class ICacheService {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  abstract setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean>;
  abstract del(key: string): Promise<void>;
  abstract reset(): Promise<void>;
}
