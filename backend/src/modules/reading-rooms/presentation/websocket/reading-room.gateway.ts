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
import { ReadingRoomClientEvent } from '../../reading-room.events';
import type {
  RoomSocket,
  SocketData,
  RoomSnapshot,
} from './reading-room.types';
import { WsUser } from './core/ws-user.decorator';
import { WsThrottle, WsThrottleGuard } from './core/ws-throttle.guard';

import { WsAckResponse } from '@/shared/presentation/ws-ack.type';
import { EventNames } from '@/shared/platform/constants/event-names.constant';

import { WsExceptionFilter } from '@/shared/platform/filters/ws-exception.filter';
import { WsValidationPipe } from '@/presentation/gateways/pipes/ws-validation.pipe';
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
   * LÆ°u namespace Ä‘á»ƒ cÃ¡c service cÃ³ thá»ƒ truy cáº­p, rá»“i Ä‘Äƒng kÃ½ middleware handshake.
   * Middleware xÃ¡c thá»±c WebSocket ticket vÃ  Ä‘Äƒng kÃ½ connection slot trÆ°á»›c khi
   * cho socket káº¿t ná»‘i; thÃ´ng tin user há»£p lá»‡ Ä‘Æ°á»£c gáº¯n vÃ o socket.data.
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
   * Hook cháº¡y khi user káº¿t ná»‘i thÃ nh cÃ´ng.
   * GÃ¡n socket vÃ o room "user:{userId}" Ä‘á»ƒ tiá»‡n gá»­i thÃ´ng bÃ¡o cÃ¡ nhÃ¢n (vÃ­ dá»¥ bá»‹ kick).
   */
  handleConnection(socket: RoomSocket) {
    void socket.join(`user:${socket.data.userId}`);
  }

  /**
   * Dá»n cÃ¡c tráº¡ng thÃ¡i gáº¯n vá»›i socket khi káº¿t ná»‘i bá»‹ ngáº¯t:
   * 1. LÆ°u ngay tiáº¿n Ä‘á»™ Ä‘á»c Ä‘ang chá», rá»“i xÃ³a state/socket khá»i tracker trong RAM.
   * 2. Náº¿u socket Ä‘ang á»Ÿ phÃ²ng Ä‘á»c, cáº­p nháº­t presence; chá»‰ xÃ³a presence khi user
   *    khÃ´ng cÃ²n tab nÃ o khÃ¡c trong cÃ¹ng phÃ²ng.
   * 3. LuÃ´n nháº£ slot cá»§a socket trong Redis Ä‘á»ƒ khÃ´ng tÃ­nh nÃ³ vÃ o giá»›i háº¡n káº¿t ná»‘i.
   *
   * Má»—i bÆ°á»›c dá»n dáº¹p Ä‘Æ°á»£c báº¯t lá»—i riÃªng Ä‘á»ƒ lá»—i á»Ÿ bÆ°á»›c trÆ°á»›c khÃ´ng ngÄƒn cÃ¡c bÆ°á»›c sau.
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
   * Xá»­ lÃ½ hÃ nh Ä‘á»™ng ngÆ°á»i dÃ¹ng xin tham gia vÃ o má»™t PhÃ²ng Ä‘á»c sÃ¡ch.
   * Tráº£ vá» chi tiáº¿t phÃ²ng, lá»‹ch sá»­ tin nháº¯n, vÃ  danh sÃ¡ch ngÆ°á»i Ä‘ang online.
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
   * Xá»­ lÃ½ hÃ nh Ä‘á»™ng ngÆ°á»i dÃ¹ng chá»§ Ä‘á»™ng rá»i phÃ²ng.
   * Náº¿u lÃ  chá»§ phÃ²ng rá»i Ä‘i, há»‡ thá»‘ng sáº½ tá»± báº§u chá»n ngÆ°á»i khÃ¡c lÃ m chá»§ phÃ²ng má»›i.
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
   * Nhá»‹p tim (Heartbeat) bÃ¡o hiá»‡u user váº«n Ä‘ang online.
   * Ghi nháº­n % tiáº¿n Ä‘á»™ Ä‘á»c vÃ  cáº­p nháº­t tháº» Presence Ä‘á»ƒ khÃ´ng bá»‹ tá»± Ä‘á»™ng Ä‘Ã¡ ra.
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
   * ThÃªm Highlight (TÃ´ sÃ¡ng) vÃ o má»™t Ä‘oáº¡n vÄƒn báº£n.
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
   * XÃ³a má»™t Highlight do chÃ­nh mÃ¬nh táº¡o.
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
   * YÃªu cáº§u AI sinh ra má»™t thÃ´ng tin chi tiáº¿t (Insight) vá» Ä‘oáº¡n vá»«a Highlight.
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
   * Láº¯ng nghe sá»± kiá»‡n tá»« Event Bus ná»™i bá»™ cá»§a NestJS khi AI Ä‘Ã£ xá»­ lÃ½ xong Insight,
   * Ä‘á»ƒ Ä‘áº©y (emit) káº¿t quáº£ vá» cho cÃ¡c user trong phÃ²ng.
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
