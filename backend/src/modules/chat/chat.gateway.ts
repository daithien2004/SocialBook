import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';
import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { v4 as uuidv4 } from 'uuid'; // Thêm uuid để tạo messageId

class MessageDto {
  @IsString()
  @IsNotEmpty()

  room?: string; // For group messages

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  to?: string; // For private messages (socket ID of recipient)
}

class TypingDto {
  @IsString()
  @IsNotEmpty()
  room?: string; // For group typing

  @IsString()
  to?: string; // For private typing

  @IsBoolean()
  isTyping: boolean; // True if typing, false if stopped
}

class ReceiptDto {
  @IsString()
  @IsNotEmpty()
  messageId: string; // ID của tin nhắn

  @IsString()
  room?: string; // For group messages

  @IsString()
  to?: string; // For private messages
}

class ReadReceiptDto {
  @IsString()
  @IsNotEmpty()
  messageId: string; // ID của tin nhắn đã đọc

  @IsString()
  room?: string; // For group messages

  @IsString()
  to?: string; // For private messages
}

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000' },
  namespace: '/chat', // Namespace để tách biệt
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.server.emit(
      'userList',
      Array.from(this.server.sockets.sockets.keys()),
    ); // Broadcast danh sách user
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.server.emit(
      'userList',
      Array.from(this.server.sockets.sockets.keys()),
    ); // Cập nhật danh sách
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ): void {
    if (!room) throw new WsException('Room name is required');
    client.join(room);
    this.server.to(room).emit('message', {
      messageId: uuidv4(),
      user: 'system',
      text: `${client.id} joined room ${room}`,
      room,
      deliveredTo: [client.id],
      readBy: [client.id],
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ): void {
    if (!room) throw new WsException('Room name is required');
    client.leave(room);
    this.server.to(room).emit('message', {
      messageId: uuidv4(),
      user: 'system',
      text: `${client.id} left room ${room}`,
      room,
      deliveredTo: [client.id],
      readBy: [client.id],
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: MessageDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const messageId = uuidv4(); // Tạo ID duy nhất cho tin nhắn
    if (data.room) {
      // Group message
      this.server.to(data.room).emit('message', {
        user: client.id,
        text: data.text,
        room: data.room,
        messageId,
        deliveredTo: [client.id],
        readBy: [client.id], // Người gửi tự động đánh dấu đã đọc
      });
    } else if (data.to) {
      // Private message
      this.server.to(data.to).emit('message', {
        user: client.id,
        text: data.text,
        private: true,
        messageId,
        deliveredTo: [client.id],
        readBy: [client.id],
      });
      client.emit('message', {
        user: client.id,
        text: data.text,
        private: true,
        messageId,
        deliveredTo: [client.id],
        readBy: [client.id],
      });
    } else {
      throw new WsException('Room or recipient must be specified');
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: TypingDto,
    @ConnectedSocket() client: Socket,
  ): void {
    if (data.room) {
      // Group typing
      this.server.to(data.room).emit('typing', {
        user: client.id,
        isTyping: data.isTyping,
        room: data.room,
      });
    } else if (data.to) {
      // Private typing
      this.server.to(data.to).emit('typing', {
        user: client.id,
        isTyping: data.isTyping,
        private: true,
      });
      client.emit('typing', {
        user: client.id,
        isTyping: data.isTyping,
        private: true,
      }); // Gửi lại cho sender
    } else {
      throw new WsException('Room or recipient must be specified');
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('deliveryReceipt')
  handleDeliveryReceipt(
    @MessageBody() data: ReceiptDto,
    @ConnectedSocket() client: Socket,
  ): void {
    if (data.room) {
      // Group delivery receipt
      this.server.to(data.room).emit('deliveryReceipt', {
        messageId: data.messageId,
        deliveredTo: client.id,
        room: data.room,
      });
    } else if (data.to) {
      // Private delivery receipt
      this.server.to(data.to).emit('deliveryReceipt', {
        messageId: data.messageId,
        deliveredTo: client.id,
        private: true,
      });
      client.emit('deliveryReceipt', {
        messageId: data.messageId,
        deliveredTo: client.id,
        private: true,
      });
    } else {
      throw new WsException('Room or recipient must be specified');
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('readMessage')
  handleReadMessage(
    @MessageBody() data: ReadReceiptDto,
    @ConnectedSocket() client: Socket,
  ): void {
    if (data.room) {
      // Group read receipt
      this.server.to(data.room).emit('readReceipt', {
        messageId: data.messageId,
        readBy: client.id,
        room: data.room,
      });
    } else if (data.to) {
      // Private read receipt
      this.server.to(data.to).emit('readReceipt', {
        messageId: data.messageId,
        readBy: client.id,
        private: true,
      });
      client.emit('readReceipt', {
        messageId: data.messageId,
        readBy: client.id,
        private: true,
      });
    } else {
      throw new WsException('Room or recipient must be specified');
    }
  }
}
