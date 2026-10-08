// notifications/notifications.gateway.ts
import { Logger, UseFilters } from '@nestjs/common';
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
import { DefaultEventsMap, Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './create-notification.dto';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from '@/shared/platform/constants/event-names.constant';
import { UserRoleChangedEvent } from '@/modules/users/application/public-api';

interface SocketData extends Record<string, unknown> {
  userId: string;
}

type NotificationsServer = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;
type NotificationsSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

import { WsExceptionFilter } from '@/shared/platform/filters/ws-exception.filter';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  maxHttpBufferSize: 1e6,
  transports: ['websocket'],
  pingInterval: 25000,
  pingTimeout: 20000,
})
@UseFilters(WsExceptionFilter)
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer() server!: NotificationsServer;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwt: JwtService,
  ) {}

  afterInit(server: NotificationsServer) {
    this.notificationsService.setServer(this.server);
    server.use((socket, next) => {
      (async () => {
        try {
          const authToken: unknown = socket.handshake.auth.token;
          const headerToken =
            socket.handshake.headers.authorization?.split(' ')[1];
          const token = typeof authToken === 'string' ? authToken : headerToken;

          if (!token) {
            next(new Error('unauthorized'));
            return;
          }

          const payload = await this.jwt.verifyAsync<{
            sub?: string;
            id?: string;
          }>(token);

          const userId = payload.sub ?? payload.id;
          if (!userId) {
            next(new Error('unauthorized'));
            return;
          }

          const sockets = await server.in(`user:${userId}`).fetchSockets();
          if (sockets.length >= 5) {
            next(new Error('too_many_connections'));
            return;
          }

          socket.data.userId = userId;
          next();
        } catch {
          next(new Error('unauthorized'));
        }
      })().catch((err: unknown) => {
        next(err instanceof Error ? err : new Error(String(err)));
      });
    });
  }

  @OnEvent(EventNames.USER_ROLE_CHANGED)
  handleUserRoleChanged(event: UserRoleChangedEvent) {
    this.logger.debug(
      `User ${event.userId} role changed, forcing socket disconnect.`,
    );
    this.server.in(`user:${event.userId}`).disconnectSockets(true);
  }

  handleConnection(socket: NotificationsSocket) {
    const userId = socket.data.userId;
    if (userId) {
      void socket.join(`user:${userId}`);
    }
  }

  handleDisconnect() {
    // cleanup náº¿u cáº§n
  }

  // Cho phÃ©p client chá»§ Ä‘á»™ng yÃªu cáº§u data
  @SubscribeMessage('notification:list')
  async list(@ConnectedSocket() socket: NotificationsSocket) {
    const userId = socket.data.userId;
    return this.notificationsService.findAllByUser(userId);
  }

  @SubscribeMessage('notification:markRead')
  async markRead(
    @ConnectedSocket() socket: NotificationsSocket,
    @MessageBody() body: { id: string },
  ) {
    const userId = socket.data.userId;
    return this.notificationsService.markRead(userId, body.id);
  }

  @SubscribeMessage('notification:markAllRead')
  async markAllRead(@ConnectedSocket() socket: NotificationsSocket) {
    const userId = socket.data.userId;
    return this.notificationsService.markAllRead(userId);
  }

  // (tuá»³ chá»n) cho phÃ©p backend khÃ¡c emit qua gateway â€” hoáº·c gá»i tháº³ng service.create()
  @SubscribeMessage('createNotification')
  async createFromClient(
    @ConnectedSocket() socket: NotificationsSocket,
    @MessageBody() data: CreateNotificationDto,
  ) {
    return this.notificationsService.create(data);
  }
}
