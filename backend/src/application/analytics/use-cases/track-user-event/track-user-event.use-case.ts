import { Injectable, Logger } from '@nestjs/common';
import { TrackUserEventCommand } from './track-user-event.command';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class TrackUserEventUseCase {
  private readonly logger = new Logger(TrackUserEventUseCase.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async execute(command: TrackUserEventCommand): Promise<void> {
    try {
      await this.redis.rpush(
        'analytics:events:buffer',
        JSON.stringify(command),
      );
    } catch (error) {
      this.logger.error('Failed to buffer analytics event in Redis', error);
    }
  }
}
