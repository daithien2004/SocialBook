import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import {
  AnalyticsEventBufferPort,
  type AnalyticsEventPayload,
} from '../../application/ports/analytics-event-buffer.port';

const ANALYTICS_EVENT_BUFFER_KEY = 'analytics:events:buffer';

@Injectable()
export class RedisAnalyticsEventBufferAdapter extends AnalyticsEventBufferPort {
  constructor(@InjectRedis() private readonly redis: Redis) {
    super();
  }

  async append(event: AnalyticsEventPayload): Promise<void> {
    await this.redis.rpush(ANALYTICS_EVENT_BUFFER_KEY, JSON.stringify(event));
  }

  async takeAll(): Promise<string[]> {
    const result = await this.redis
      .multi()
      .lrange(ANALYTICS_EVENT_BUFFER_KEY, 0, -1)
      .del(ANALYTICS_EVENT_BUFFER_KEY)
      .exec();
    const events = result?.[0]?.[1];
    return Array.isArray(events) ? events.map(String) : [];
  }
}
