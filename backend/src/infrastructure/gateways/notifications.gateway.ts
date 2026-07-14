// notifications/notifications.gateway.ts
import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from '@/infrastructure/notifications/notifications.service';
import type { CreateNotificationInput } from '@/infrastructure/notifications/dto/create-notification-input.interface';
import { JwtService } from '@nestjs/jwt';

interface SocketData {
  userId: string;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  maxHttpBufferSize: 1e6,
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer() server: Server;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwt: JwtService,
  ) {}

  afterInit() {
    this.notificationsService.setServer(this.server);
  }

  handleConnection(socket: Socket) {
    try {
      const auth = socket.handshake.auth as unknown as { token: string };
      const query = socket.handshake.query as unknown as { token: string };

      const token = auth?.token ?? query?.token;

      if (typeof token !== 'string' || !token) {
        this.logger.warn('No token, disconnect');
        socket.disconnect(true);
        return;
      }

      const payload = this.jwt.verify<{ sub?: string; id?: string }>(token, {
        complete: false,
      });
      const userId = payload.sub ?? payload.id;
      if (!userId) {
        socket.disconnect(true);
        return;
      }
      (socket.data as SocketData).userId = userId;
      void socket.join(`user:${userId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Token expired hoặc invalid là expected — dùng warn thay vì error
      if (message.includes('expired') || message.includes('invalid')) {
        this.logger.warn(`WS connection rejected (token issue): ${message}`);
      } else {
        this.logger.error(`WS error in handleConnection: ${message}`);
      }
      socket.disconnect(true);
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
