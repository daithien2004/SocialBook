import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { createReadingRoomActor } from '@/modules/reading-rooms/application/policies/reading-room.ability';
import { WsAuthService } from './core/ws-auth.service';

import { ReadingRoomPresenceCoordinator } from './reading-room-presence.coordinator';
import { ReadingProgressQueuePort } from '../../application/ports/external/reading-progress-queue.port';

import { JoinRoomCommand } from '@/modules/reading-rooms/application/commands/join-room/join-room.command';
import { LeaveRoomCommand } from '@/modules/reading-rooms/application/commands/leave-room/leave-room.command';
import { GetRoomByCodeQuery } from '@/modules/reading-rooms/application/queries/get-room-by-code/get-room-by-code.query';
import { ReadingRoomForbiddenError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';

import { RoomSocket, SocketData, RoomSnapshot } from './reading-room.types';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { ReadingRoomServerEvent } from './reading-room.socket-events';

import { toReadingRoomSnapshot } from './reading-room-snapshot.mapper';
import { WsAckResponse } from '@/shared/platform/websocket/ws-ack.type';
import { ReadingRoomNamespaceProvider } from './reading-room.namespace-provider';
import { UserOperationLock } from './user-operation-lock';
import { DISCONNECT_PRESENCE_GRACE_MS } from './reading-room.constants';

const roomChannel = (id: string) => `room:${id}`;
const userChannel = (id: string) => `user:${id}`;

@Injectable()
export class ReadingRoomConnectionHandler {
  private readonly logger = new Logger(ReadingRoomConnectionHandler.name);
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly presenceCoordinator: ReadingRoomPresenceCoordinator,
    private readonly progressQueue: ReadingProgressQueuePort,
    private readonly wsAuth: WsAuthService,
    private readonly namespaceProvider: ReadingRoomNamespaceProvider,
    private readonly userOperationLock: UserOperationLock,
  ) {}

  /**
   *
   */
  async handleJoinRoom(
    socket: RoomSocket,
    sd: SocketData,
    body: JoinRoomDto,
  ): Promise<WsAckResponse<{ snapshot: RoomSnapshot }>> {
    return this.userOperationLock.runExclusive(sd.userId, async () => {
      const userId = sd.userId;
      const { roomCode } = body;

      const actor = createReadingRoomActor(userId, sd.role);
      const roomId = await this.commandBus.execute<string>(
        new JoinRoomCommand(actor, roomCode),
      );
      const room = await this.queryBus.execute(
        new GetRoomByCodeQuery(roomId, actor),
      );
      if (!room.isMember) {
        throw new ReadingRoomForbiddenError('Operation is not allowed.');
      }

      await this.leaveOldRoomIfNeeded(socket, sd, roomId);

      const displayName = sd.displayName;
      const avatarUrl = sd.avatarUrl || '';

      sd.roomId = roomId;
      sd.bookId = room.bookId;
      sd.displayName = displayName;
      sd.avatarUrl = avatarUrl;

      await socket.join(roomChannel(roomId));

      const presences = await this.presenceCoordinator.onJoin(
        roomId,
        userId,
        socket.id,
        {
          userId,
          displayName,
          avatarUrl,
          currentChapterSlug: room.currentChapterSlug,
        },
      );

      socket
        .to(roomChannel(roomId))
        .emit(ReadingRoomServerEvent.MEMBER_JOINED, {
          userId,
          displayName,
        });

      return {
        ok: true,
        snapshot: toReadingRoomSnapshot(room, presences),
      };
    });
  }

  /**
   * 1. Heartbeat progress is already enqueued before acknowledgement; no explicit flush is needed here.
   * 3. Bu?c g? b? s? hi?n di?n (presence) c?a user kh?i b? d?m Redis.
   *
   * @param socket Socket c?a client.
   */
  async handleLeaveRoom(
    socket: RoomSocket,
    sd: SocketData,
    body: LeaveRoomDto,
  ): Promise<void> {
    return this.userOperationLock.runExclusive(sd.userId, async () => {
      const userId = sd.userId;
      const roomId = body.roomId;

      const actor = createReadingRoomActor(userId, sd.role);
      const command = new LeaveRoomCommand(actor, roomId, body.newHostId);
      await this.commandBus.execute(command);
      const room = await this.queryBus.execute(
        new GetRoomByCodeQuery(roomId, actor),
      );

      await this.presenceCoordinator.onLeave(roomId, userId, socket.id, {
        forceRemove: true,
      });

      if (room.status === 'ended') {
        try {
          const namespace = this.namespaceProvider.getServer();
          namespace
            .to(roomChannel(roomId))
            .emit(ReadingRoomServerEvent.ROOM_ENDED, { roomId });
          namespace.in(roomChannel(roomId)).socketsLeave(roomChannel(roomId));
        } catch {
          // Server not initialized
        }
        await this.presenceCoordinator.removeAllFromRoom(roomId);
      } else {
        try {
          const namespace = this.namespaceProvider.getServer();
          namespace.in(userChannel(userId)).socketsLeave(roomChannel(roomId));
          namespace
            .to(roomChannel(roomId))
            .emit(ReadingRoomServerEvent.MEMBER_LEFT, { userId });
        } catch {
          // Server not initialized
        }
      }
      delete sd.roomId;
    });
  }

  async handleDisconnect(socket: RoomSocket): Promise<void> {
    const { userId, roomId } = socket.data;
    if (!roomId) return;

    try {
      await this.userOperationLock.runExclusive(userId, () => {
        const timer = setTimeout(() => {
          void this.userOperationLock
            .runExclusive(userId, async () => {
              await this.presenceCoordinator.onDisconnect(socket);
            })
            .catch((error: unknown) => {
              this.logger.error(
                `Failed delayed disconnect cleanup for user ${userId}`,
                error instanceof Error ? error.stack : String(error),
              );
            });
        }, DISCONNECT_PRESENCE_GRACE_MS);
        timer.unref();
        return Promise.resolve();
      });
    } catch (error) {
      this.logger.error(
        `Failed to schedule disconnect cleanup for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * 4. Enqueue progress for BullMQ debounce by user/book/chapter and worker persistence to PostgreSQL.
   *
   * @param socket Socket c?a client.
   */
  async handleHeartbeat(
    socket: RoomSocket,
    sd: SocketData,
    body: HeartbeatDto,
  ): Promise<void> {
    const { userId, displayName, avatarUrl = '' } = sd;

    await this.wsAuth.touchConnection(userId, socket.id);

    if (sd.roomId && !socket.rooms.has(roomChannel(sd.roomId))) {
      this.logger.debug(
        `Socket ${socket.id} was removed from room ${sd.roomId} by another tab`,
      );
      delete sd.roomId;
      return;
    }

    const chapterSlug = body.chapterSlug || '';
    const chapterId = body.chapterId;
    const paragraphId = body.paragraphId || undefined;
    const progress =
      body.progress !== undefined ? Math.round(body.progress) : undefined;

    if (sd.roomId) {
      await this.presenceCoordinator.onHeartbeat(sd.roomId, userId, socket.id, {
        userId,
        displayName,
        avatarUrl,
        currentChapterSlug: chapterSlug,
        paragraphId: paragraphId,
        progress: progress,
      });

      if (sd.bookId && chapterId && progress !== undefined) {
        await this.progressQueue.enqueue({
          userId,
          bookId: sd.bookId,
          chapterId,
          progress,
        });
      }
    }
  }

  /**
   *
   * @param socket Socket c?a client.
   */
  private async leaveOldRoomIfNeeded(
    socket: RoomSocket,
    sd: SocketData,
    newRoomId: string,
  ) {
    if (sd.roomId && sd.roomId !== newRoomId) {
      await socket.leave(roomChannel(sd.roomId));
      await this.presenceCoordinator.onLeave(sd.roomId, sd.userId, socket.id);
    }
  }
}
