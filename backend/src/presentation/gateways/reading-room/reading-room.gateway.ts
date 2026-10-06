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

import { WsAuthService } from '../core/ws-auth.service';
import { ReadingRoomPresenceCoordinator } from './reading-room-presence.coordinator';
import { ReadingProgressTracker } from './reading-progress.tracker';
import { ReadingRoomHighlightHandler } from './reading-room-highlight.handler';
import { WsRoomGuard } from '../core/ws-room.guard';
import { ReadingRoomConnectionHandler } from './reading-room-connection.handler';
import { ReadingRoomNamespaceProvider } from './reading-room.namespace-provider';
import { OnEvent } from '@nestjs/event-emitter';
import { ReadingRoomClientEvent } from './reading-room.events';
import type {
  RoomSocket,
  SocketData,
  RoomSnapshot,
} from './reading-room.types';
import { WsUser } from '../core/ws-user.decorator';
import { WsThrottle, WsThrottleGuard } from '../core/ws-throttle.guard';

import { WsAckResponse } from '@/shared/presentation/ws-ack.type';
import { EventNames } from '@/common/constants/event-names.constant';

import { WsExceptionFilter } from '@/common/filters/ws-exception.filter';
import { WsValidationPipe } from '../pipes/ws-validation.pipe';
import { toHandshakeError } from './reading-room.handshake';
import { JoinRoomDto } from '../dto/join-room.dto';
import { LeaveRoomDto } from '../dto/leave-room.dto';
import { AddHighlightDto } from '../dto/add-highlight.dto';
import { RemoveHighlightDto } from '../dto/remove-highlight.dto';
import { GenerateInsightDto } from '../dto/generate-insight.dto';
import { HeartbeatDto } from '../dto/heartbeat.dto';
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
    private readonly presenceCoordinator: ReadingRoomPresenceCoordinator,
    private readonly highlightHandler: ReadingRoomHighlightHandler,
    private readonly progressTracker: ReadingProgressTracker,
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
   * Middleware xác thực WebSocket ticket và đăng ký connection slot trước khi
   * cho socket kết nối; thông tin user hợp lệ được gắn vào socket.data.
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
   * Hook chạy khi user kết nối thành công.
   * Gán socket vào room "user:{userId}" để tiện gửi thông báo cá nhân (ví dụ bị kick).
   */
  handleConnection(socket: RoomSocket) {
    void socket.join(`user:${socket.data.userId}`);
  }

  /**
   * Dọn các trạng thái gắn với socket khi kết nối bị ngắt:
   * 1. Lưu ngay tiến độ đọc đang chờ, rồi xóa state/socket khỏi tracker trong RAM.
   * 2. Nếu socket đang ở phòng đọc, cập nhật presence; chỉ xóa presence khi user
   *    không còn tab nào khác trong cùng phòng.
   * 3. Luôn nhả slot của socket trong Redis để không tính nó vào giới hạn kết nối.
   *
   * Mỗi bước dọn dẹp được bắt lỗi riêng để lỗi ở bước trước không ngăn các bước sau.
   */
  async handleDisconnect(@ConnectedSocket() socket: RoomSocket) {
    try {
      try {
        await this.progressTracker.dispose(socket);
      } catch (e) {
        this.logger.error(
          'Error disposing progress tracker',
          e instanceof Error ? e.stack : String(e),
        );
      }

      try {
        const { roomId } = socket.data;
        if (roomId) {
          await this.presenceCoordinator.onDisconnect(socket);
        }
      } catch (e) {
        this.logger.error(
          'Error handling disconnect presence',
          e instanceof Error ? e.stack : String(e),
        );
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
    return this.connectionHandler.handleLeaveRoom(socket, sd, body);
  }

  // ==========================================
  // 3. MEMBER PRESENCE & PROGRESS
  // ==========================================

  /**
   * Nhịp tim (Heartbeat) báo hiệu user vẫn đang online.
   * Ghi nhận % tiến độ đọc và cập nhật thẻ Presence để không bị tự động đá ra.
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
