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
import { Logger, UseFilters, UsePipes, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Namespace, Server } from 'socket.io';

import { WsAuthService } from './ws-auth.service';
import { ReadingRoomPresenceCoordinator } from './reading-room-presence.coordinator';
import { ReadingProgressTracker } from './reading-progress.tracker';
import { ReadingRoomHighlightHandler } from './reading-room-highlight.handler';
import { WsRoomGuard } from './ws-room.guard';
import { WsRateLimiter } from './ws-rate-limiter.service';
import { ReadingRoomEmitter } from './reading-room.emitter';
import { ReadingRoomSystemListener } from './reading-room-system.listener';
import { CommandBus } from '@nestjs/cqrs';
import { JoinRoomCommand } from '@/application/reading-rooms/use-cases/join-room/join-room.command';
import { LeaveRoomCommand } from '@/application/reading-rooms/use-cases/leave-room/leave-room.command';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ReadingRoomServerEvent,
  ReadingRoomClientEvent,
} from './reading-room.events';
import type { RoomSocket, SocketData } from './reading-room.types';
import { WsUser } from './ws-user.decorator';

import { normalizeError } from '@/shared/presentation/error-normalizer';
import { messageOf } from '@/shared/domain/error-messages';
import { WsAckResponse } from '@/shared/presentation/ws-ack.type';
import { EventNames } from '@/common/constants/event-names.constant';

import { WsExceptionFilter } from '@/common/filters/ws-exception.filter';
import { WsValidationPipe } from './dto/ws-validation.pipe';
import { toHandshakeError } from './reading-room.handshake';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { AddHighlightDto } from './dto/add-highlight.dto';
import { RemoveHighlightDto } from './dto/remove-highlight.dto';
import { GenerateInsightDto } from './dto/generate-insight.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import {
  CHAPTER_SLUG_MAX_LENGTH,
  PARAGRAPH_ID_MAX_LENGTH,
  PROGRESS_MAX,
  PROGRESS_MIN,
  WS_CONNECT_TIMEOUT_MS,
  WS_MAX_HTTP_BUFFER_SIZE,
  WS_PING_INTERVAL_MS,
  WS_PING_TIMEOUT_MS,
  WS_TRANSPORTS,
  isObjectId,
} from './reading-room.constants';
import { ErrorCode } from '@/shared/domain/error-codes';

@WebSocketGateway({
  namespace: '/reading-rooms',
  cors: { origin: '*' },
  maxHttpBufferSize: WS_MAX_HTTP_BUFFER_SIZE,
  connectTimeout: WS_CONNECT_TIMEOUT_MS,
  transports: [...WS_TRANSPORTS],
  pingInterval: WS_PING_INTERVAL_MS,
  pingTimeout: WS_PING_TIMEOUT_MS,
})
@UseFilters(WsExceptionFilter)
@UsePipes(
  new WsValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ReadingRoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly presenceCoordinator: ReadingRoomPresenceCoordinator,
    private readonly commandBus: CommandBus,
    private readonly highlightHandler: ReadingRoomHighlightHandler,
    private readonly progressTracker: ReadingProgressTracker,
    private readonly rateLimiter: WsRateLimiter,
    private readonly emitter: ReadingRoomEmitter,
    private readonly systemListener: ReadingRoomSystemListener,
  ) {}

  private readonly logger = new Logger(ReadingRoomGateway.name);

  @WebSocketServer() server: Server;

  // ==========================================
  // 1. LIFECYCLE HOOKS & MIDDLEWARE
  // ==========================================

  /**
   * Khởi tạo Gateway, cài đặt các service liên quan và Middleware Handshake.
   * Chặn kết nối nếu token không hợp lệ trước khi user kịp join.
   */
  afterInit(server: Namespace) {
    this.presenceCoordinator.setServer(server);
    this.emitter.setServer(server);
    this.systemListener.setServer(server);

    server.use(async (socket, next) => {
      try {
        Object.assign(socket.data, await this.wsAuth.authenticate(socket));
        next();
      } catch (e) {
        return next(toHandshakeError(e));
      }
    });
  }

  /**
   * Hook chạy khi user kết nối thành công.
   * Gán socket vào room "user:{userId}" để tiện gửi thông báo cá nhân (ví dụ bị kick).
   */
  handleConnection(socket: RoomSocket) {
    void socket.join(`user:${socket.data.userId}`);
  }

  /**
   * Hook chạy khi người dùng đóng tab, mất mạng hoặc chủ động ngắt kết nối.
   * Luôn đảm bảo lưu tiến độ, báo offline và nhả slot connection.
   */
  async handleDisconnect(@ConnectedSocket() socket: RoomSocket) {
    try {
      await this.progressTracker.flush(socket);
      const { roomId } = socket.data;

      if (roomId) {
        await this.presenceCoordinator.onDisconnect(socket);
      }
    } finally {
      if (socket.data?.userId) {
        await this.wsAuth.releaseConnectionSlot(socket.data.userId, socket.id);
      }
    }
  }

  // ==========================================
  // 2. CORE ROOM MANAGEMENT
  // ==========================================

  /**
   * Xử lý hành động người dùng xin tham gia vào một Phòng đọc sách.
   * Trả về chi tiết phòng, lịch sử tin nhắn, và danh sách người đang online.
   */
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() socket: RoomSocket,
    @WsUser() sd: SocketData,
    @MessageBody() body: JoinRoomDto,
  ): Promise<WsAckResponse<{ snapshot: Record<string, unknown> }>> {
    const userId = sd.userId;
    const { roomCode } = body;

    if (await this.rateLimiter.isLimited(userId, 'join_room', 10)) {
      this.logger.warn(`Rate limit exceeded for join_room by ${userId}`);
      return { 
        ok: false, 
        code: ErrorCode.RATE_LIMITED, 
        message: messageOf(ErrorCode.RATE_LIMITED) 
      };
    }

    try {
      const command = new JoinRoomCommand(userId, roomCode);
      const room = await this.commandBus.execute(command);
      const roomId = room.roomId;

      if (sd.roomId && sd.roomId !== roomId) {
        void socket.leave(`room:${sd.roomId}`);
        await this.presenceCoordinator.onLeave(sd.roomId, userId);
      }

      const displayName = sd.displayName || 'Unknown';
      const avatarUrl = sd.avatarUrl || '';

      sd.roomId = roomId;
      sd.bookId = room.bookId;
      sd.displayName = displayName;
      sd.avatarUrl = avatarUrl;

      void socket.join(`room:${roomId}`);

      const presences = await this.presenceCoordinator.onJoin(roomId, userId, {
        userId,
        displayName,
        avatarUrl,
        currentChapterSlug: room.currentChapterSlug,
      });

      const snapshotHighlights = room.highlights;

      socket.to(`room:${roomId}`).emit(ReadingRoomServerEvent.MEMBER_JOINED, {
        userId,
        displayName,
      });
      this.emitter
        .toRoom(roomId)
        .emit(ReadingRoomServerEvent.PRESENCE_UPDATE, presences);

      const presenceMap = new Map(presences.map((p) => [p.userId, p]));

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
              const presence = presenceMap.get(h.userId);
              const displayName =
                h.displayName || presence?.displayName || 'Thành viên';
              const avatarUrl = h.avatarUrl || presence?.avatarUrl || '';
              return {
                id: h.id,
                userId: h.userId,
                displayName,
                avatarUrl,
                chapterSlug: h.chapterSlug,
                paragraphId: h.paragraphId,
                content: h.content,
                aiInsight: h.aiInsight,
                createdAt: h.createdAt,
                user: {
                  userId: h.userId,
                  displayName,
                  avatarUrl,
                },
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
      const { code, message, isSystemError } = normalizeError(error);

      if (isSystemError) {
        this.logger.error(
          `Join failed for ${userId}`,
          error instanceof Error ? error.stack : String(error),
        );
      } else {
        this.logger.warn(`Join failed for ${userId} (Code: ${code}): ${message}`);
      }

      return { ok: false, code, message };
    }
  }

  /**
   * Xử lý hành động người dùng chủ động rời phòng.
   * Nếu là chủ phòng rời đi, hệ thống sẽ tự bầu chọn người khác làm chủ phòng mới.
   */
  @UseGuards(WsRoomGuard)
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() socket: RoomSocket,
    @WsUser() sd: SocketData,
    @MessageBody() body: LeaveRoomDto,
  ) {
    const userId = sd.userId;
    const roomId = body.roomId;

    // Lưu ngay tiến độ đọc dở (không để timer 10s chạy sau khi đã rời phòng)
    await this.progressTracker.flush(socket);

    const command = new LeaveRoomCommand(userId, roomId, body.newHostId);
    const result = await this.commandBus.execute(command);
    const presences = await this.presenceCoordinator.onLeave(roomId, userId);

    void socket.leave(`room:${roomId}`);
    delete sd.roomId;

    if (result.hostChanged && result.hostId) {
      this.emitter.toRoom(roomId).emit(ReadingRoomServerEvent.HOST_CHANGED, {
        newHostId: result.hostId,
      });
    }

    if (result.modeChanged) {
      this.emitter.toRoom(roomId).emit(ReadingRoomServerEvent.MODE_CHANGED, {
        mode: result.mode as 'sync' | 'free',
        changedBy: 'system',
      });
    }

    if (result.roomEnded) {
      this.emitter.toRoom(roomId).emit(ReadingRoomServerEvent.ROOM_ENDED, {
        endedBy: userId,
      });
    }

    this.emitter
      .toRoom(roomId)
      .emit(ReadingRoomServerEvent.MEMBER_LEFT, { userId });

    this.emitter
      .toRoom(roomId)
      .emit(ReadingRoomServerEvent.PRESENCE_UPDATE, presences);
  }

  // ==========================================
  // 3. MEMBER PRESENCE & PROGRESS
  // ==========================================

  /**
   * Nhịp tim (Heartbeat) báo hiệu user vẫn đang online.
   * Ghi nhận % tiến độ đọc và cập nhật thẻ Presence để không bị tự động đá ra.
   */
  @UseGuards(WsRoomGuard)
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() socket: RoomSocket,
    @WsUser() sd: SocketData,
    @MessageBody() body: HeartbeatDto,
  ) {
    const { userId, displayName = '', avatarUrl = '' } = sd;

    if (await this.rateLimiter.isLimited(userId, 'heartbeat', 90)) return;

    await this.wsAuth.touchConnection(userId, socket.id);

    const chapterSlug = String(body.chapterSlug || '').slice(
      0,
      CHAPTER_SLUG_MAX_LENGTH,
    );
    const chapterId = isObjectId(body.chapterId) ? body.chapterId : undefined;
    const paragraphId = body.paragraphId
      ? String(body.paragraphId).slice(0, PARAGRAPH_ID_MAX_LENGTH)
      : undefined;
    const progress =
      body.progress !== undefined
        ? Math.max(
            PROGRESS_MIN,
            Math.min(PROGRESS_MAX, Math.round(Number(body.progress) || 0)),
          )
        : undefined;

    if (displayName && sd.roomId) {
      await this.presenceCoordinator.onHeartbeat(sd.roomId, userId, {
        userId,
        displayName,
        avatarUrl,
        currentChapterSlug: chapterSlug,
        paragraphId: paragraphId,
        progress: progress,
      });

      if (sd.bookId && chapterId && progress !== undefined) {
        this.progressTracker.schedule(socket, sd.bookId, chapterId, progress);
      }
    }
  }

  // ==========================================
  // 4. HIGHLIGHT FEATURES
  // ==========================================

  /**
   * Thêm Highlight (Tô sáng) vào một đoạn văn bản.
   */
  @UseGuards(WsRoomGuard)
  @SubscribeMessage('add_highlight')
  async handleAddHighlight(
    @ConnectedSocket() socket: RoomSocket,
    @WsUser() sd: SocketData,
    @MessageBody() body: AddHighlightDto,
  ) {
    return this.highlightHandler.handleAddHighlight(socket, sd, body);
  }

  /**
   * Xóa một Highlight do chính mình tạo.
   */
  @UseGuards(WsRoomGuard)
  @SubscribeMessage(ReadingRoomClientEvent.REMOVE_HIGHLIGHT)
  async handleRemoveHighlight(
    @ConnectedSocket() socket: RoomSocket,
    @WsUser('userId') userId: string,
    @MessageBody() body: RemoveHighlightDto,
  ) {
    return this.highlightHandler.handleRemoveHighlight(socket, userId, body);
  }

  /**
   * Yêu cầu AI sinh ra một thông tin chi tiết (Insight) về đoạn vừa Highlight.
   */
  @UseGuards(WsRoomGuard)
  @SubscribeMessage(ReadingRoomClientEvent.GENERATE_HIGHLIGHT_INSIGHT)
  async handleGenerateHighlightInsight(
    @ConnectedSocket() socket: RoomSocket,
    @WsUser('userId') userId: string,
    @MessageBody() body: GenerateInsightDto,
  ) {
    return this.highlightHandler.handleGenerateHighlightInsight(
      socket,
      userId,
      body,
    );
  }

  /**
   * Lắng nghe sự kiện từ Event Bus nội bộ của NestJS khi AI đã xử lý xong Insight,
   * để đẩy (emit) kết quả về cho các user trong phòng.
   */
  @OnEvent(EventNames.READING_ROOM_HIGHLIGHT_INSIGHT_UPDATED)
  handleHighlightInsightUpdated(payload: {
    roomId: string;
    highlightId: string;
    insight: string;
  }) {
    this.highlightHandler.handleHighlightInsightUpdated(payload);
  }
}
