import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Namespace } from 'socket.io';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { EventNames } from '@/common/constants/event-names.constant';
import { UserRoleChangedEvent } from '@/application/users/events/user-role-changed.event';
import { TOKEN_REVOCATION_TTL_SECONDS } from './reading-room.constants';
import { ReadingRoomEmitter } from './reading-room.emitter';
import { ReadingRoomServerEvent } from './reading-room.events';

@Injectable()
export class ReadingRoomSystemListener {
  private readonly logger = new Logger(ReadingRoomSystemListener.name);
  private server: Namespace;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly emitter: ReadingRoomEmitter,
  ) {}

  setServer(server: Namespace) {
    this.server = server;
  }

  @OnEvent(EventNames.USER_ROLE_CHANGED)
  async handleUserRoleChanged(event: UserRoleChangedEvent) {
    this.logger.debug(
      `User ${event.userId} role changed, revoking tokens and forcing socket disconnect.`,
    );
    try {
      await this.redis.set(
        `auth:revoked:${event.userId}`,
        Date.now(),
        'EX',
        TOKEN_REVOCATION_TTL_SECONDS,
      );
    } catch (e: unknown) {
      this.logger.error('Failed to set token revocation timestamp', e);
    }

    if (this.server) {
      this.server.in(`user:${event.userId}`).disconnectSockets(true);
    }
  }

  @OnEvent(EventNames.READING_ROOM_REACTIVATED)
  handleRoomReactivated(payload: { roomId: string; reactivatedBy: string }) {
    this.emitter
      .toRoom(payload.roomId)
      .emit(ReadingRoomServerEvent.ROOM_REACTIVATED, {
        reactivatedBy: payload.reactivatedBy,
      });
  }
}
