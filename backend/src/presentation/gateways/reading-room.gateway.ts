import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayInit,
  OnGatewayDisconnect,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseFilters } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { GenerateHighlightInsightUseCase } from '@/application/reading-rooms/use-cases/generate-highlight-insight/generate-highlight-insight.use-case';
import { GenerateHighlightInsightCommand } from '@/application/reading-rooms/use-cases/generate-highlight-insight/generate-highlight-insight.command';
import { ReadingRoomPresenceService } from '@/application/reading-rooms/presence/reading-room-presence.service';
import { JoinRoomUseCase } from '@/application/reading-rooms/use-cases/join-room/join-room.use-case';
import { LeaveRoomUseCase } from '@/application/reading-rooms/use-cases/leave-room/leave-room.use-case';
import { ChangeChapterUseCase } from '@/application/reading-rooms/use-cases/change-chapter/change-chapter.use-case';
import { ChangeRoomModeUseCase } from '@/application/reading-rooms/use-cases/change-room-mode/change-room-mode.use-case';
import { EndRoomUseCase } from '@/application/reading-rooms/use-cases/end-room/end-room.use-case';
import { DeleteRoomUseCase } from '@/application/reading-rooms/use-cases/delete-room/delete-room.use-case';
import { DeleteRoomCommand } from '@/application/reading-rooms/use-cases/delete-room/delete-room.command';
import { JoinRoomCommand } from '@/application/reading-rooms/use-cases/join-room/join-room.command';
import { LeaveRoomCommand } from '@/application/reading-rooms/use-cases/leave-room/leave-room.command';
import { ChangeChapterCommand } from '@/application/reading-rooms/use-cases/change-chapter/change-chapter.command';
import { ChangeRoomModeCommand } from '@/application/reading-rooms/use-cases/change-room-mode/change-room-mode.command';
import { EndRoomCommand } from '@/application/reading-rooms/use-cases/end-room/end-room.command';
import { AddHighlightUseCase } from '@/application/reading-rooms/use-cases/add-highlight/add-highlight.use-case';
import { AddHighlightCommand } from '@/application/reading-rooms/use-cases/add-highlight/add-highlight.command';
import { RemoveHighlightUseCase } from '@/application/reading-rooms/use-cases/remove-highlight/remove-highlight.use-case';
import { RemoveHighlightCommand } from '@/application/reading-rooms/use-cases/remove-highlight/remove-highlight.command';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ReadingRoomServerEvent,
  ReadingRoomClientEvent,
} from './reading-room.events';
import { UserRoleChangedEvent } from '@/application/users/events/user-role-changed.event';
import { UpdateProgressUseCase } from '@/application/library/use-cases/update-progress/update-progress.use-case';
import { UpdateProgressCommand } from '@/application/library/use-cases/update-progress/update-progress.command';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { BookId as ChapterBookId } from '@/domain/chapters/value-objects/book-id.vo';

import { EventNames } from '@/common/constants/event-names.constant';

interface SocketData {
  userId?: string;
  role?: string;
  displayName?: string;
  avatarUrl?: string;
  roomId?: string;
  bookId?: string;
  chapterSlugToId?: Record<string, string>;
  pendingProgress?: {
    bookId: string;
    chapterSlug: string;
    progress: number;
  };
  progressTimer?: NodeJS.Timeout;
}

import { WsExceptionFilter } from '@/common/filters/ws-exception.filter';

@WebSocketGateway({
  namespace: '/reading-rooms',
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
  maxHttpBufferSize: 1e5,
  connectTimeout: 10_000,
  transports: ['websocket'],
  pingInterval: 25000,
  pingTimeout: 20000,
})
@UseFilters(WsExceptionFilter)
export class ReadingRoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ReadingRoomGateway.name);
  // Batch presence broadcasts — only emit every 3s per room
  private readonly presenceBroadcastPending = new Map<string, NodeJS.Timeout>();

  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly presenceService: ReadingRoomPresenceService,
    private readonly joinRoomUseCase: JoinRoomUseCase,
    private readonly leaveRoomUseCase: LeaveRoomUseCase,
    private readonly changeChapterUseCase: ChangeChapterUseCase,
    private readonly changeRoomModeUseCase: ChangeRoomModeUseCase,
    private readonly endRoomUseCase: EndRoomUseCase,
    private readonly deleteRoomUseCase: DeleteRoomUseCase,
    private readonly addHighlightUseCase: AddHighlightUseCase,
    private readonly removeHighlightUseCase: RemoveHighlightUseCase,

    private readonly generateHighlightInsightUseCase: GenerateHighlightInsightUseCase,
    private readonly updateProgressUseCase: UpdateProgressUseCase,
    private readonly chapterRepository: IChapterRepository,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
      (async () => {
        try {
          let token =
            (socket.handshake.auth?.token as string | undefined) ??
            socket.handshake.headers.authorization?.split(' ')[1];

          if (!token && socket.handshake.headers.cookie) {
            const match = socket.handshake.headers.cookie.match(
              /(?:^|;\s*)sb_access_token=([^;]+)/,
            );
            if (match) token = match[1];
          }

          if (!token) {
            return next(new Error('unauthorized'));
          }

          const payload = await this.jwt.verifyAsync<{
            sub?: string;
            id?: string;
            role?: string;
            displayName?: string;
            avatarUrl?: string;
          }>(token);

          const userId = (payload.sub ?? payload.id) as string;
          if (!userId) {
            return next(new Error('unauthorized'));
          }

          const sockets = await server.in(`user:${userId}`).fetchSockets();
          if (sockets.length >= 5) {
            return next(new Error('too_many_connections'));
          }

          (socket.data as SocketData).userId = userId;
          (socket.data as SocketData).role = payload.role ?? 'user';
          (socket.data as SocketData).displayName = payload.displayName;
          (socket.data as SocketData).avatarUrl = payload.avatarUrl;
          next();
        } catch {
          next(new Error('unauthorized'));
        }
      })().catch((err) =>
        next(err instanceof Error ? err : new Error(String(err))),
      );
    });
  }

  private async saveReadingProgress(
    socket: Socket,
    bookId: string,
    chapterSlug: string,
    progress: number,
  ): Promise<void> {
    const sd = socket.data as SocketData;
    const userId = sd.userId;
    if (!userId) return;

    sd.chapterSlugToId = sd.chapterSlugToId || {};
    let chapterId = sd.chapterSlugToId[chapterSlug];

    if (!chapterId) {
      try {
        const chapter = await this.chapterRepository.findBySlug(
          chapterSlug,
          ChapterBookId.create(bookId),
        );
        if (!chapter) return;
        chapterId = chapter.id.toString();
        sd.chapterSlugToId[chapterSlug] = chapterId;
      } catch {
        return;
      }
    }
    try {
      await this.updateProgressUseCase.execute(
        new UpdateProgressCommand(userId, bookId, chapterId, progress, true),
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to save reading progress for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async flushProgress(socket: Socket) {
    const sd = socket.data as SocketData;
    if (sd.progressTimer) {
      clearTimeout(sd.progressTimer);
      sd.progressTimer = undefined;
    }

    const pending = sd.pendingProgress;
    if (pending && sd.userId) {
      sd.pendingProgress = undefined;
      await this.saveReadingProgress(
        socket,
        pending.bookId,
        pending.chapterSlug,
        pending.progress,
      ).catch((e) => this.logger.warn(`Flush progress error: ${e}`));
    }
  }

  @OnEvent(EventNames.READING_ROOM_HIGHLIGHT_INSIGHT_UPDATED)
  handleHighlightInsightUpdated(payload: {
    roomId: string;
    highlightId: string;
    insight: string;
  }) {
    this.server
      .to(`room:${payload.roomId}`)
      .emit(ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT, {
        highlightId: payload.highlightId,
        insight: payload.insight,
      });
  }

  @SubscribeMessage('add_highlight')
  async handleAddHighlight(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      roomId: string;
      chapterSlug: string;
      paragraphId: string;
      content: string;
    },
  ) {
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';

    if (await this.isRateLimited(userId, 'add_highlight', 30)) {
      this.emitError(
        socket,
        'RATE_LIMITED',
        'Rate limit exceeded for adding highlights',
      );
      return;
    }
    try {
      const command = new AddHighlightCommand(
        body.roomId,
        userId,
        body.chapterSlug,
        body.paragraphId,
        body.content,
      );
      const room = await this.addHighlightUseCase.execute(command);

      const newHighlight = room.highlights[room.highlights.length - 1];

      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.NEW_HIGHLIGHT, {
          ...newHighlight,
          user: {
            userId,
            displayName: sd.displayName ?? '',
            avatarUrl: sd.avatarUrl ?? '',
          },
        });
    } catch (error: unknown) {
      this.emitError(socket, 'HIGHLIGHT_FAILED', 'Highlight failed', error);
    }
  }

  @SubscribeMessage(ReadingRoomClientEvent.REMOVE_HIGHLIGHT)
  async handleRemoveHighlight(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; highlightId: string },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new RemoveHighlightCommand(
        body.roomId,
        userId,
        body.highlightId,
      );
      await this.removeHighlightUseCase.execute(command);

      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.HIGHLIGHT_REMOVED, {
          highlightId: body.highlightId,
          removedBy: userId,
        });
    } catch (error: unknown) {
      this.emitError(
        socket,
        'HIGHLIGHT_REMOVE_FAILED',
        'Remove highlight failed',
        error,
      );
    }
  }

  @SubscribeMessage(ReadingRoomClientEvent.GENERATE_HIGHLIGHT_INSIGHT)
  async handleGenerateHighlightInsight(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; highlightId: string },
  ) {
    if (!this.isInRoom(socket, body.roomId)) {
      this.emitError(socket, 'NOT_IN_ROOM', 'Bạn chưa tham gia phòng này');
      return;
    }

    const userId = (socket.data as SocketData).userId ?? '';

    // B3: Rate limit max 5/min cho insight
    if (await this.isRateLimited(userId, 'generate_insight', 5)) {
      this.emitError(
        socket,
        'RATE_LIMITED',
        'Rate limit exceeded for generating insights',
      );
      return;
    }

    try {
      const command = new GenerateHighlightInsightCommand(
        userId,
        body.roomId,
        body.highlightId,
      );
      // Generate AI Insight. The use-case will emit EventNames.READING_ROOM_HIGHLIGHT_INSIGHT_UPDATED
      // which will then be broadcasted to the room.
      await this.generateHighlightInsightUseCase.execute(command);
    } catch (error: unknown) {
      this.emitError(
        socket,
        'GENERATE_INSIGHT_FAILED',
        'Generate insight failed',
        error,
      );
    }
  }

  @OnEvent(EventNames.USER_ROLE_CHANGED)
  handleUserRoleChanged(event: UserRoleChangedEvent) {
    this.logger.debug(
      `User ${event.userId} role changed, forcing socket disconnect.`,
    );
    this.server.in(`user:${event.userId}`).disconnectSockets(true);
  }

  handleConnection(socket: Socket) {
    const userId = (socket.data as SocketData).userId;
    if (userId) {
      void socket.join(`user:${userId}`);
    }
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    await this.flushProgress(socket);
    const sd = socket.data as SocketData;
    const userId = sd.userId;
    const roomId = sd.roomId;

    if (userId && roomId) {
      await this.presenceService.removePresence(roomId, userId);
      const roomPresences = await this.presenceService.getRoomPresences(roomId);
      this.server
        .to(`room:${roomId}`)
        .emit(ReadingRoomServerEvent.PRESENCE_UPDATE, roomPresences);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: { roomCode: string; displayName: string; avatarUrl: string },
  ) {
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';

    if (await this.isRateLimited(userId, 'join_room', 10)) {
      this.logger.warn(`Rate limit exceeded for join_room by ${userId}`);
      return { ok: false, code: 'RATE_LIMITED' };
    }

    try {
      const command = new JoinRoomCommand(userId, body.roomCode);
      const room = await this.joinRoomUseCase.execute(command);
      const roomId = room.roomId;

      if (sd.roomId && sd.roomId !== roomId) {
        void socket.leave(`room:${sd.roomId}`);
        await this.presenceService.removePresence(sd.roomId, userId);
      }

      const displayName = sd.displayName || 'Unknown';
      const avatarUrl = sd.avatarUrl || '';

      sd.roomId = roomId;
      sd.bookId = room.bookId;
      sd.displayName = displayName;
      sd.avatarUrl = avatarUrl;

      void socket.join(`room:${roomId}`);

      await this.presenceService.upsertPresence(roomId, userId, {
        userId,
        displayName,
        avatarUrl,
        currentChapterSlug: room.currentChapterSlug,
      });

      const presences = await this.presenceService.getRoomPresences(roomId);

      const snapshotHighlights = room.highlights;

      socket.to(`room:${roomId}`).emit(ReadingRoomServerEvent.MEMBER_JOINED, {
        userId,
        displayName,
      });
      this.server
        .to(`room:${roomId}`)
        .emit(ReadingRoomServerEvent.PRESENCE_UPDATE, presences);

      return {
        ok: true,
        snapshot: {
          room: {
            roomId: room.roomId,
            bookId: room.bookId,
            hostId: room.hostId,
            mode: room.mode,
            currentChapterSlug: room.currentChapterSlug,
            status: room.status,
            highlights: snapshotHighlights.map((h) => {
              const presence = presences.find((p) => p.userId === h.userId);
              return {
                id: h.id,
                userId: h.userId,
                user: presence
                  ? {
                      id: h.userId,
                      username: presence.displayName,
                      image: presence.avatarUrl,
                    }
                  : { id: h.userId, username: 'Thành viên' },
                chapterSlug: h.chapterSlug,
                paragraphId: h.paragraphId,
                content: h.content,
                aiInsight: h.aiInsight,
                createdAt: h.createdAt,
              };
            }),
            chatMessages: [],
          },
          members: room.members.map((m) => ({
            userId: m.userId,
            role: m.role,
          })),
          presences,
        },
      };
    } catch (error: unknown) {
      let code = 'JOIN_FAILED';
      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'NotFoundDomainException') {
          code = 'NOT_FOUND';
          this.logger.warn(
            `Failed join attempt: room ${body.roomCode} not found for user ${userId}`,
          );
        } else if (error.name === 'ForbiddenDomainException') {
          code = 'FORBIDDEN';
        } else if (error.name === 'RoomFullDomainException') {
          code = 'FULL';
        } else if (error.name === 'UnauthorizedDomainException') {
          code = 'UNAUTHORIZED';
        }
      }
      this.logger.warn(
        `Join failed for ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { ok: false, code };
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; newHostId?: string },
  ) {
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';
    const roomId = body.roomId;

    try {
      const command = new LeaveRoomCommand(userId, roomId, body.newHostId);
      const result = await this.leaveRoomUseCase.execute(command);
      await this.presenceService.removePresence(roomId, userId);

      void socket.leave(`room:${roomId}`);
      delete sd.roomId;

      if (result.hostId) {
        this.server
          .to(`room:${roomId}`)
          .emit(ReadingRoomServerEvent.HOST_CHANGED, {
            newHostId: result.hostId,
          });
      }

      this.server
        .to(`room:${roomId}`)
        .emit(ReadingRoomServerEvent.MEMBER_LEFT, { userId });

      const presences = await this.presenceService.getRoomPresences(roomId);
      this.server
        .to(`room:${roomId}`)
        .emit(ReadingRoomServerEvent.PRESENCE_UPDATE, presences);
    } catch (error: unknown) {
      this.emitError(socket, 'LEAVE_FAILED', 'Leave failed', error);
    }
  }

  @SubscribeMessage('chapter_change')
  async handleChapterChange(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      roomId: string;
      chapterSlug: string;
      bookId?: string;
      chapterId?: string;
    },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new ChangeChapterCommand(
        userId,
        body.roomId,
        body.chapterSlug,
      );
      await this.changeChapterUseCase.execute(command);

      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.CHAPTER_CHANGED, {
          chapterSlug: body.chapterSlug,
          byUserId: userId,
        });
    } catch (error: unknown) {
      this.emitError(
        socket,
        'CHAPTER_CHANGE_FAILED',
        'Chapter change failed',
        error,
      );
    }
  }

  @SubscribeMessage('change_mode')
  async handleChangeMode(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; mode: 'sync' | 'free' },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new ChangeRoomModeCommand(userId, body.roomId, body.mode);
      await this.changeRoomModeUseCase.execute(command);
      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.MODE_CHANGED, {
          mode: body.mode,
          changedBy: userId,
        });
    } catch (error: unknown) {
      this.emitError(socket, 'MODE_CHANGE_FAILED', 'Mode change failed', error);
    }
  }

  @SubscribeMessage('end_room')
  async handleEndRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new EndRoomCommand(userId, body.roomId);
      await this.endRoomUseCase.execute(command);
      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.ROOM_ENDED, { endedBy: userId });

      const presences = await this.presenceService.getRoomPresences(
        body.roomId,
      );
      await Promise.all(
        presences.map((p) =>
          this.presenceService.removePresence(body.roomId, p.userId),
        ),
      );
    } catch (error: unknown) {
      this.emitError(socket, 'END_ROOM_FAILED', 'End room failed', error);
    }
  }

  @SubscribeMessage('delete_room')
  async handleDeleteRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new DeleteRoomCommand(userId, body.roomId);
      await this.deleteRoomUseCase.execute(command);
      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.ROOM_DELETED, { deletedBy: userId });
    } catch (error: unknown) {
      this.emitError(socket, 'DELETE_ROOM_FAILED', 'Delete room failed', error);
    }
  }

  private emitError(
    socket: Socket,
    code: string,
    defaultMsg: string,
    error?: unknown,
  ) {
    let message = defaultMsg;
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      String(error.name).endsWith('DomainException')
    ) {
      message = (error as Error).message;
    } else if (error) {
      this.logger.error(
        `WS Error [${code}]`,
        error instanceof Error ? error.stack : error,
      );
    }
    socket.emit(ReadingRoomServerEvent.ERROR, { code, message });
  }

  private isInRoom(socket: Socket, roomId?: string): roomId is string {
    const sd = socket.data as SocketData;
    return (
      !!roomId && sd.roomId === roomId && socket.rooms.has(`room:${roomId}`)
    );
  }

  private async isRateLimited(
    userId: string,
    event: string,
    maxPerMinute = 30,
  ): Promise<boolean> {
    if (!userId) return false;
    const key = `rl:ws:${event}:${userId}`;
    try {
      const res = await this.redis
        .multi()
        .set(key, 0, 'EX', 60, 'NX')
        .incr(key)
        .exec();
      const current = Number(res?.[1]?.[1] ?? 0);
      return current > maxPerMinute;
    } catch {
      return false; // Fallback allow on Redis failure
    }
  }

  private schedulePresenceBroadcast(roomId: string): void {
    if (this.presenceBroadcastPending.has(roomId)) return;
    const timer = setTimeout(() => {
      this.presenceBroadcastPending.delete(roomId);
      this.presenceService
        .getRoomPresences(roomId)
        .then((presences) => {
          this.server
            .to(`room:${roomId}`)
            .emit(ReadingRoomServerEvent.PRESENCE_UPDATE, presences);
        })
        .catch((error: unknown) => {
          this.logger.error(
            `Failed to broadcast presences for room ${roomId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    }, 3000);
    this.presenceBroadcastPending.set(roomId, timer);
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      roomId: string;
      chapterSlug: string;
      paragraphId?: string;
      progress?: number;
      bookId?: string;
    },
  ) {
    if (!this.isInRoom(socket, body.roomId)) {
      this.emitError(socket, 'NOT_IN_ROOM', 'Bạn chưa tham gia phòng này');
      return;
    }

    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';
    const displayName = sd.displayName ?? '';
    const avatarUrl = sd.avatarUrl ?? '';

    if (await this.isRateLimited(userId, 'heartbeat', 90)) return;

    const chapterSlug = String(body.chapterSlug || '').slice(0, 200);
    const paragraphId = body.paragraphId
      ? String(body.paragraphId).slice(0, 100)
      : undefined;
    const progress =
      body.progress !== undefined
        ? Math.max(0, Math.min(100, Math.round(Number(body.progress) || 0)))
        : undefined;

    if (userId && displayName && sd.roomId) {
      await this.presenceService.upsertPresence(sd.roomId, userId, {
        userId,
        displayName,
        avatarUrl,
        currentChapterSlug: chapterSlug,
        paragraphId: paragraphId,
        progress: progress,
      });

      if (sd.bookId && progress !== undefined) {
        sd.pendingProgress = {
          bookId: sd.bookId,
          chapterSlug: chapterSlug,
          progress: progress,
        };
        sd.progressTimer ??= setTimeout(() => {
          this.flushProgress(socket).catch((err: unknown) => {
            this.logger.error('Failed to flush progress', err);
          });
        }, 10_000);
      }

      this.schedulePresenceBroadcast(sd.roomId);
    }
  }

  @OnEvent(EventNames.READING_ROOM_REACTIVATED)
  handleRoomReactivated(payload: { roomId: string; reactivatedBy: string }) {
    this.server
      .to(`room:${payload.roomId}`)
      .emit(ReadingRoomServerEvent.ROOM_REACTIVATED, {
        reactivatedBy: payload.reactivatedBy,
      });
  }
}
