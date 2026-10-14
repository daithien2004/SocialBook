import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Emitter } from '@socket.io/redis-emitter';
import { EventNames } from '@/shared/platform/constants/event-names.constant';
import { ReadingRoomServerEvent } from './reading-room.socket-events';

@Injectable()
export class ReadingRoomRealtimeListener {
  private readonly logger = new Logger(ReadingRoomRealtimeListener.name);
  private emitter: Emitter;

  constructor(@InjectRedis() private readonly redis: Redis) {
    this.emitter = new Emitter(this.redis);
  }

  @OnEvent(EventNames.READING_ROOM_HIGHLIGHT_INSIGHT_UPDATED)
  handleHighlightInsightUpdated(payload: {
    roomId: string;
    highlightId: string;
    insight: string;
  }) {
    this.logger.debug(
      `Worker emitting highlight insight to room: room:${payload.roomId}`,
    );
    this.emitter
      .of('/')
      .to(`room:${payload.roomId}`)
      .emit(ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT, {
        highlightId: payload.highlightId,
        insight: payload.insight,
      });
  }
}
