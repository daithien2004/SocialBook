export const CACHE_SERVICE_TOKEN = 'CACHE_SERVICE_TOKEN';

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean>;
  del(key: string): Promise<void>;
  reset(): Promise<void>;
}
