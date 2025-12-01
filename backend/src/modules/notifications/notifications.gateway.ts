// notifications/notifications.gateway.ts
import {
  WebSocketGateway, WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect,
  ConnectedSocket, SubscribeMessage, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*' }, // dev
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwt: JwtService,
  ) {}

  afterInit() {
    this.notificationsService.setServer(this.server);
  }

  async handleConnection(socket: Socket) {
    try {
      const auth = socket.handshake.auth as any;
      const query = socket.handshake.query as any;

      let token = auth?.token ?? query?.token;
      if (Array.isArray(token)) {
        token = token[0];
      }

      console.log('WS TOKEN =', token);

      if (!token || typeof token !== 'string') {
        console.log('No token, disconnect');
        socket.disconnect(true);
        return;
      }

      const payload: any = this.jwt.verify(token);
      const userId = payload.sub || payload.id;

      (socket.data as any).userId = userId;
      socket.join(`user:${userId}`);
      console.log('WS connected', socket.id, 'user', userId);
    } catch (e) {
      console.error('WS error in handleConnection:', e);
      socket.disconnect(true);
    }
  }


  handleDisconnect(@ConnectedSocket() socket: Socket) {
    // cleanup nếu cần
  }

  // Cho phép client chủ động yêu cầu data
  @SubscribeMessage('notification:list')
  async list(@ConnectedSocket() socket: Socket) {
    const userId = (socket.data as any).userId;
    return this.notificationsService.findAllByUser(userId);
  }

  @SubscribeMessage('notification:markRead')
  async markRead(@ConnectedSocket() socket: Socket, @MessageBody() body: { id: string }) {
    const userId = (socket.data as any).userId;
    return this.notificationsService.markRead(userId, body.id);
  }

  // (tuỳ chọn) cho phép backend khác emit qua gateway — hoặc gọi thẳng service.create()
  @SubscribeMessage('createNotification')
  async createFromClient(@ConnectedSocket() socket: Socket, @MessageBody() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }
}
