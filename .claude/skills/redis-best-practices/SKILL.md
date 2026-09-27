---
name: redis-best-practices
description: Redis caching patterns for this NestJS project. Covers the ICachePort/RedisCacheAdapter port-adapter pattern, @InjectRedis (ioredis), key naming, TTL strategy, fail-safe error handling, distributed locks, and the Socket.IO Redis adapter for horizontal scaling. Triggers on tasks involving caching, sessions, rate limiting, Redis, or scaling real-time features.
---

# Redis Best Practices

## Overview

This project uses **Redis** via `@nestjs-modules/ioredis` with a **Clean Architecture port/adapter** design. Redis serves three roles: caching (`ICachePort`), Socket.IO horizontal scaling (`RedisIoAdapter`), and OAuth state storage.

## Trigger

Activate when working on:
- Cache reads/writes (`ICachePort`, `RedisCacheAdapter`)
- Socket.IO scaling across instances (`RedisIoAdapter`)
- Rate limiting and distributed locks
- Session / OAuth state storage
- Cache invalidation strategy

## Architecture

```
shared/domain/cache.port.ts               → ICachePort (interface, domain layer)
infrastructure/cache/redis-cache.adapter.ts → RedisCacheAdapter (implements ICachePort)
presentation/gateways/redis-io.adapter.ts   → RedisIoAdapter (Socket.IO scaling)
infrastructure/auth/adapters/redis-oauth-state.adapter.ts → OAuth state
```

## The Cache Port (Domain Layer)

Define the contract in the domain/shared layer — never inject Redis directly into use-cases:

```typescript
// shared/domain/cache.port.ts
export interface ICachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  setIfNotExists(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  reset(): Promise<void>;
}
```

## The Redis Adapter (Infrastructure Layer)

```typescript
// infrastructure/cache/redis-cache.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import type { ICachePort } from '@/shared/domain/cache.port';
import { getErrorMessage } from '@/common/utils/error.util';

@Injectable()
export class RedisCacheAdapter implements ICachePort {
  private readonly logger = new Logger(RedisCacheAdapter.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.error(`Failed to get cache key "${key}": ${getErrorMessage(error)}`);
      return null; // Fail-safe: cache miss, not a crash
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds !== undefined) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Failed to set cache key "${key}": ${getErrorMessage(error)}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete cache key "${key}": ${getErrorMessage(error)}`);
    }
  }

  async setIfNotExists(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    try {
      // Atomic SET NX EX — used for locks and dedup
      const result = await this.redis.call('SET', key, value, 'NX', 'EX', ttlSeconds);
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Failed to set nx cache key "${key}": ${getErrorMessage(error)}`);
      return false;
    }
  }

  async reset(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      this.logger.error(`Failed to reset cache: ${getErrorMessage(error)}`);
    }
  }
}
```

### Key Rules for the Adapter

1. **Every method wraps in try/catch** — Redis failure must never crash the request path.
2. **Fail-safe returns**: `get` → `null`, `setIfNotExists` → `false`, mutations → no-op. The caller treats it as a cache miss, not an error.
3. **`getErrorMessage(error)`** from `@/common/utils/error.util` — never `error.message` directly (error may be `unknown`).
4. **`setex` for TTL** rather than `set` + `expire` (one round-trip, atomic).
5. **JSON serialize** at the adapter boundary — callers pass/ receive typed objects.

## Consuming the Port

Inject the **port token**, not the adapter class:

```typescript
@Injectable()
export class GetBookUseCase {
  constructor(@Inject(ICachePort) private readonly cache: ICachePort) {}

  async execute(bookId: string): Promise<Book | null> {
    const cacheKey = `book:${bookId}`;
    const cached = await this.cache.get<Book>(cacheKey);
    if (cached) return cached;

    const book = await this.bookRepository.findById(bookId);
    if (book) await this.cache.set(cacheKey, book, 300);
    return book;
  }
}
```

## Cache Invalidation

Invalidate on every mutation of the cached entity — including list/aggregate keys that contain it:

```typescript
async updateBook(id: string, dto: UpdateBookDto): Promise<Book> {
  const book = await this.bookRepository.update(id, dto);
  await this.cache.del(`book:${id}`);
  await this.cache.del('books:all');   // list caches that include this entity
  return book;
}
```

## Key Naming Conventions

Use `entity:identifier[:qualifier]` — always prefixed and scoped:

```
book:{bookId}
book:{bookId}:chapters
user:{userId}:profile
user:{userId}:recommendations
books:all
search:{hashOfQuery}
rate:{ip}:{endpoint}
lock:{resource}:{id}
oauth:state:{state}
```

## TTL Guidelines

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Entity by ID | 300s (5 min) | Balances freshness vs. load |
| List / aggregate | 60–120s | Changes more often |
| User profile | 3600s (1 hour) | Rarely changes |
| Rate limit counter | 60s | Per-minute window |
| Distributed lock | 30s | Short critical sections |
| OAuth state | 600s | One-shot, short-lived |

Always set a TTL — unbounded keys leak memory.

## Distributed Locks

Built on the atomic `setIfNotExists` (SET NX EX):

```typescript
async withLock<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T | null> {
  const lockKey = `lock:${key}`;
  const token = crypto.randomUUID();
  const acquired = await this.cache.setIfNotExists(lockKey, token, ttlSeconds);
  if (!acquired) return null; // Someone else holds the lock

  try {
    return await fn();
  } finally {
    await this.cache.del(lockKey);
  }
}
```

> For production-critical locks across services, prefer Redlock semantics; the above is sufficient for single-cluster dedup.

## Socket.IO Horizontal Scaling

When running multiple backend instances, Socket.IO needs a Redis adapter so events reach clients on other instances:

```typescript
// presentation/gateways/redis-io.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(redisUrl: string): Promise<void> {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

Wire it in `main.ts`: `app.useWebSocketAdapter(new RedisIoAdapter(app))` after `connectToRedis`.

> Note: the Socket.IO adapter uses the `redis` package (pub/sub clients), while the cache adapter uses `ioredis`. Both are intentional — don't unify them.

## Anti-Patterns

- ❌ Injecting `Redis` directly into a use-case — go through `ICachePort`.
- ❌ Throwing from a cache method — cache is best-effort; log and degrade.
- ❌ Keys without a TTL — memory leak.
- ❌ `set` then `expire` as two calls — use `setex`.
- ❌ Caching without invalidating on write — stale reads.
- ❌ Storing large objects (>100 KB) — cache metadata/IDs, not blobs.