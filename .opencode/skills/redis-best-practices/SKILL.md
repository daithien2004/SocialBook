---
name: redis-best-practices
description: Redis caching patterns, session management, rate limiting, pub/sub, and distributed locks. Triggers on tasks involving caching, sessions, real-time features, or Redis configuration.
---

# Redis Best Practices

## Overview

Guidelines for effective Redis usage in NestJS applications for caching, sessions, and real-time features.

## Trigger

Activate when:
- Implementing caching strategies
- Setting up session management
- Building real-time features with Redis
- Optimizing database queries
- Managing rate limiting

## Use Cases

| Use Case | Redis Data Structure |
|----------|---------------------|
| Session storage | String/Hash |
| User cache | String (JSON) |
| Rate limiting | String + Lua |
| Leaderboard | Sorted Set |
| Pub/Sub | Pub/Sub |
| Job queues | List |
| Distributed locks | String |

## Installation

```typescript
// redis.module.ts
@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.register({
      host: config.get('REDIS_HOST'),
      port: config.get('REDIS_PORT'),
      password: config.get('REDIS_PASSWORD'),
    }),
  ],
  exports: [RedisModule],
})
export class RedisModule {}
```

## Caching Patterns

### Simple Cache

```typescript
@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(): Promise<User[]> {
    const cached = await this.cacheManager.get<User[]>('users:all');
    if (cached) return cached;

    const users = await this.userRepository.findAll();
    await this.cacheManager.set('users:all', users, { ttl: 300 });
    return users;
  }
}
```

### Cache with Tags

```typescript
async cacheUser(user: User): Promise<void> {
  const key = `user:${user.id}`;
  await this.cacheManager.set(key, user, { ttl: 3600 });
  await this.cacheManager.set(`user:${user.email}`, user.id, { ttl: 3600 });
}
```

### Cache Invalidation

```typescript
// Invalidate on update
async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
  const user = await this.userRepository.update(id, dto);
  
  // Invalidate cache
  await this.cacheManager.del(`user:${id}`);
  await this.cacheManager.del('users:all');
  
  return user;
}
```

## Rate Limiting

```typescript
// rate-limiter.guard.ts
@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(
    private redis: RedisService,
    @Inject(REQUEST) private request: Request,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ip = this.request.ip;
    const key = `rate:${ip}`;
    
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, 60);
    }
    
    if (current > 100) {
      throw new TooManyRequestsException();
    }
    
    return true;
  }
}
```

## Session Management

```typescript
// session.service.ts
@Injectable()
export class SessionService {
  constructor(private redis: RedisService) {}

  async createSession(userId: string, data: SessionData): Promise<string> {
    const sessionId = uuid();
    const key = `session:${sessionId}`;
    
    await this.redis.hset(key, {
      ...data,
      userId,
      createdAt: Date.now(),
    });
    await this.redis.expire(key, 7 * 24 * 60 * 60); // 7 days
    
    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return await this.redis.hgetall(`session:${sessionId}`);
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
}
```

## Pub/Sub

```typescript
// publisher.service.ts
@Injectable()
export class NotificationPublisher {
  constructor(private redis: RedisService) {}

  async publish(channel: string, message: any): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(message));
  }
}

// subscriber
this.redis.subscribe('notifications', (message) => {
  const data = JSON.parse(message);
  // Handle notification
});
```

## Distributed Locks

```typescript
@Injectable()
export class DistributedLockService {
  constructor(private redis: RedisService) {}

  async acquireLock(key: string, ttl: number = 30000): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.redis.set(lockKey, '1', 'PX', ttl, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.redis.del(`lock:${key}`);
  }

  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const acquired = await this.acquireLock(key);
    if (!acquired) {
      throw new ConflictException('Resource is locked');
    }
    
    try {
      return await fn();
    } finally {
      await this.releaseLock(key);
    }
  }
}
```

## Key Naming Conventions

```
user:{userId}:profile
user:{userId}:sessions
product:{productId}:cache
rate:{ip}:{endpoint}
lock:{resource}:{id}
session:{sessionId}
cache:{entity}:{id}
```

## TTL Guidelines

| Data Type | TTL |
|-----------|-----|
| User profile cache | 1 hour |
| Session | 7 days |
| Rate limit counter | 1 minute |
| Temporary locks | 30 seconds |
| Search results | 5 minutes |

## Best Practices

1. **Use connection pooling**
2. **Implement retry logic**
3. **Handle Redis failures gracefully**
4. **Use pipeline for batch operations**
5. **Monitor memory usage**
6. **Set appropriate TTLs**
7. **Use meaningful key prefixes**
8. **Avoid storing large objects**
