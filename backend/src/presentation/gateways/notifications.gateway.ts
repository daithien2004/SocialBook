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
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import type { CreateNotificationInput } from './dto/create-notification-input.interface';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from '@/common/constants/event-names.constant';
import { UserRoleChangedEvent } from '@/application/users/events/user-role-changed.event';

interface SocketData {
  userId: string;
}

import { WsExceptionFilter } from '@/common/filters/ws-exception.filter';

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

  @WebSocketServer() server!: Server;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwt: JwtService,
  ) {}

  afterInit(server: Server) {
    this.notificationsService.setServer(this.server);
    server.use((socket, next) => {
      (async () => {
        try {
          const token =
            (socket.handshake.auth?.token as string | undefined) ??
            socket.handshake.headers.authorization?.split(' ')[1];

          if (!token) {
            next(new Error('unauthorized'));
            return;
          }

          const payload = await this.jwt.verifyAsync<{
            sub?: string;
            id?: string;
          }>(token);

          const userId = (payload.sub ?? payload.id) as string;
          if (!userId) {
            next(new Error('unauthorized'));
            return;
          }

          const sockets = await server.in(`user:${userId}`).fetchSockets();
          if (sockets.length >= 5) {
            next(new Error('too_many_connections'));
            return;
          }

          (socket.data as SocketData).userId = userId;
          next();
        } catch {
          next(new Error('unauthorized'));
        }
      })().catch((err) => {
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

  handleConnection(socket: Socket) {
    const userId = (socket.data as SocketData).userId;
    if (userId) {
      void socket.join(`user:${userId}`);
    }
  }

  handleDisconnect() {
    // cleanup nếu cần
  }

  // Cho phép client chủ động yêu cầu data
  @SubscribeMessage('notification:list')
  async list(@ConnectedSocket() socket: Socket) {
    const userId = (socket.data as SocketData).userId;
    return this.notificationsService.findAllByUser(userId);
  }

  @SubscribeMessage('notification:markRead')
  async markRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { id: string },
  ) {
    const userId = (socket.data as SocketData).userId;
    return this.notificationsService.markRead(userId, body.id);
  }

  @SubscribeMessage('notification:markAllRead')
  async markAllRead(@ConnectedSocket() socket: Socket) {
    const userId = (socket.data as SocketData).userId;
    return await this.notificationsService.markAllRead(userId);
  }

  // (tuỳ chọn) cho phép backend khác emit qua gateway — hoặc gọi thẳng service.create()
  @SubscribeMessage('createNotification')
  async createFromClient(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: CreateNotificationInput,
  ) {
    return this.notificationsService.create(data);
  }
}
