import { TrackUserEventCommand } from './track-user-event.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@CommandHandler(TrackUserEventCommand)
export class TrackUserEventHandler {
  private readonly logger = new Logger(TrackUserEventHandler.name);

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
