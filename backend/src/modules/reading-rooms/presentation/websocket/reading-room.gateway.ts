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
import { Namespace, Server } from 'socket.io';

import { WsAuthService } from './core/ws-auth.service';
import { ReadingRoomHighlightHandler } from './reading-room-highlight.handler';
import { WsRoomGuard } from './core/ws-room.guard';
import { ReadingRoomConnectionHandler } from './reading-room-connection.handler';
import { ReadingRoomNamespaceProvider } from './reading-room.namespace-provider';
import { OnEvent } from '@nestjs/event-emitter';
import { ReadingRoomClientEvent } from './reading-room.socket-events';
import type {
  RoomSocket,
  SocketData,
  RoomSnapshot,
} from './reading-room.types';
import { WsUser } from './core/ws-user.decorator';
import { WsThrottle, WsThrottleGuard } from './core/ws-throttle.guard';

import { WsAckResponse } from '@/shared/platform/websocket/ws-ack.type';
import { EventNames } from '@/shared/platform/constants/event-names.constant';

import { WsExceptionFilter } from '@/shared/platform/filters/ws-exception.filter';
import { WsValidationPipe } from '@/shared/platform/websocket/ws-validation.pipe';
import { joinUserControlRoom } from '@/shared/platform/websocket/join-user-control-room';
import { toHandshakeError } from './reading-room.handshake';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { AddHighlightDto } from './dto/add-highlight.dto';
import { RemoveHighlightDto } from './dto/remove-highlight.dto';
import { GenerateInsightDto } from './dto/generate-insight.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import {
  WS_CONNECT_TIMEOUT_MS,
  WS_MAX_HTTP_BUFFER_SIZE,
  WS_PING_INTERVAL_MS,
  WS_PING_TIMEOUT_MS,
  WS_TRANSPORTS,
} from './reading-room.constants';

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
    private readonly highlightHandler: ReadingRoomHighlightHandler,
    private readonly connectionHandler: ReadingRoomConnectionHandler,
    private readonly namespaceProvider: ReadingRoomNamespaceProvider,
  ) {}

  private readonly logger = new Logger(ReadingRoomGateway.name);

  @WebSocketServer() server!: Server;

  // ==========================================
  // 1. LIFECYCLE HOOKS & MIDDLEWARE
  // ==========================================

  /**
   * Lưu namespace để các service có thể truy cập, rồi đăng ký middleware handshake.
   */
  afterInit(server: Namespace) {
    this.namespaceProvider.setServer(server);

    server.use(async (socket, next) => {
      try {
        Object.assign(socket.data, await this.wsAuth.authenticate(socket));
        next();
      } catch (e) {
        next(toHandshakeError(e));
        return;
      }
    });
  }

  /**
   */
  async handleConnection(socket: RoomSocket): Promise<void> {
    await joinUserControlRoom(
      socket,
      socket.data.userId,
      'reading-rooms',
      (message) => {
        this.logger.error(message);
      },
    );
  }

  /**
   * Dọn các trạng thái gắn với socket khi kết nối bị ngắt:
   * 1. Progress is enqueued in BullMQ when a heartbeat is accepted; no snapshot remains in process memory.
   * 2. Nếu socket đang ở phòng đọc, cập nhật presence; chỉ xóa presence khi user
   *
   * Mỗi bước dọn dẹp được bắt lỗi riêng để lỗi ở bước trước không ngăn các bước sau.
   */
  async handleDisconnect(@ConnectedSocket() socket: RoomSocket) {
    try {
      await this.connectionHandler.handleDisconnect(socket);
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
   */
  @UseGuards(WsThrottleGuard)
  @WsThrottle({ event: 'join_room', limit: 10 })
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() socket: RoomSocket,
    @WsUser() sd: SocketData,
    @MessageBody() body: JoinRoomDto,
  ): Promise<WsAckResponse<{ snapshot: RoomSnapshot }>> {
    return this.connectionHandler.handleJoinRoom(socket, sd, body);
  }

  /**
   */
  @UseGuards(WsRoomGuard)
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() socket: RoomSocket,
    @WsUser() sd: SocketData,
    @MessageBody() body: LeaveRoomDto,
  ) {
    return this.connectionHandler.handleLeaveRoom(socket, sd, body);
  }

  // ==========================================
  // 3. MEMBER PRESENCE & PROGRESS
  // ==========================================

  /**
   * Nhịp tim (Heartbeat) báo hiệu user vẫn đang online.
   */
  @UseGuards(WsRoomGuard, WsThrottleGuard)
  @WsThrottle({ event: 'heartbeat', limit: 90 })
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() socket: RoomSocket,
    @WsUser() sd: SocketData,
    @MessageBody() body: HeartbeatDto,
  ) {
    return this.connectionHandler.handleHeartbeat(socket, sd, body);
  }

  // ==========================================
  // 4. HIGHLIGHT FEATURES
  // ==========================================

  /**
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
