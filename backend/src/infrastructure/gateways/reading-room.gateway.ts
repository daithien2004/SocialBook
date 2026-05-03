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
import { JwtService } from '@nestjs/jwt';
import { ReadingRoomPresenceService } from './reading-room-presence.service';
import { JoinRoomUseCase } from '@/application/reading-rooms/use-cases/join-room/join-room.use-case';
import { LeaveRoomUseCase } from '@/application/reading-rooms/use-cases/leave-room/leave-room.use-case';
import { ChangeChapterUseCase } from '@/application/reading-rooms/use-cases/change-chapter/change-chapter.use-case';
import { ChangeRoomModeUseCase } from '@/application/reading-rooms/use-cases/change-room-mode/change-room-mode.use-case';
import { EndRoomUseCase } from '@/application/reading-rooms/use-cases/end-room/end-room.use-case';
import { JoinRoomCommand } from '@/application/reading-rooms/use-cases/join-room/join-room.command';
import { LeaveRoomCommand } from '@/application/reading-rooms/use-cases/leave-room/leave-room.command';
import { ChangeChapterCommand } from '@/application/reading-rooms/use-cases/change-chapter/change-chapter.command';
import { ChangeRoomModeCommand } from '@/application/reading-rooms/use-cases/change-room-mode/change-room-mode.command';
import { EndRoomCommand } from '@/application/reading-rooms/use-cases/end-room/end-room.command';
import { AddHighlightUseCase } from '@/application/reading-rooms/use-cases/add-highlight/add-highlight.use-case';
import { AddHighlightCommand } from '@/application/reading-rooms/use-cases/add-highlight/add-highlight.command';
import { AskAIUseCase } from '@/application/reading-rooms/use-cases/ask-ai/ask-ai.use-case';
import { AskAICommand } from '@/application/reading-rooms/use-cases/ask-ai/ask-ai.command';
import { OnEvent } from '@nestjs/event-emitter';
import { ReadingRoomServerEvent, ReadingRoomClientEvent } from './reading-room.events';


@WebSocketGateway({
  namespace: '/reading-rooms',
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
  maxHttpBufferSize: 1e6,
})
export class ReadingRoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly presenceService: ReadingRoomPresenceService,
    private readonly joinRoomUseCase: JoinRoomUseCase,
    private readonly leaveRoomUseCase: LeaveRoomUseCase,
    private readonly changeChapterUseCase: ChangeChapterUseCase,
    private readonly changeRoomModeUseCase: ChangeRoomModeUseCase,
    private readonly endRoomUseCase: EndRoomUseCase,
    private readonly addHighlightUseCase: AddHighlightUseCase,
    private readonly askAIUseCase: AskAIUseCase,
  ) {}

  @OnEvent('reading-room.highlight_insight_updated')
  handleHighlightInsightUpdated(payload: { roomId: string; highlightId: string; insight: string }) {
    this.server.to(`room:${payload.roomId}`).emit(ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT, {
      highlightId: payload.highlightId,
      insight: payload.insight,
    });
  }

  @OnEvent('reading-room.chat_message_added')
  handleChatMessageAdded(payload: { roomId: string; message: { userId: string, role: string, content: string, createdAt: Date } }) {
    this.server.to(`room:${payload.roomId}`).emit('new_chat_message', payload.message);
  }

  @SubscribeMessage('add_highlight')
  async handleAddHighlight(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; chapterSlug: string; paragraphId: string; content: string },
  ) {
    const userId = socket.data.userId as string;
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
      
      this.server.to(`room:${body.roomId}`).emit(ReadingRoomServerEvent.NEW_HIGHLIGHT, {
        ...newHighlight,
        user: { 
          userId, 
          displayName: socket.data.displayName,
          avatarUrl: socket.data.avatarUrl 
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Highlight failed';
      socket.emit(ReadingRoomServerEvent.ERROR, { code: 'HIGHLIGHT_FAILED', message });
    }
  }



  async handleConnection(socket: Socket) {
    try {
      const auth = socket.handshake.auth as { token?: string };
      const query = socket.handshake.query as { token?: string };

      let token = auth?.token ?? query?.token;
      if (Array.isArray(token)) token = token[0];

      if (!token || typeof token !== 'string') {
        socket.disconnect(true);
        return;
      }

      const payload = this.jwt.verify(token);
      const userId = payload.sub || payload.id;
      if (!userId) {
        socket.disconnect(true);
        return;
      }
      socket.data.userId = userId;
      socket.join(`user:${userId}`);
    } catch (e) {
      socket.disconnect(true);
    }
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    const userId = socket.data.userId;
    const roomId = socket.data.roomId;

    if (userId && roomId) {
      await this.presenceService.removePresence(roomId, userId);
      const roomPresences = await this.presenceService.getRoomPresences(roomId);
      this.server.to(`room:${roomId}`).emit(ReadingRoomServerEvent.PRESENCE_UPDATE, roomPresences);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomCode: string; displayName: string; avatarUrl: string },
  ) {
    const userId = socket.data.userId as string;
    try {
      const command = new JoinRoomCommand(userId, body.roomCode);
      const room = await this.joinRoomUseCase.execute(command);
      const roomId = room.roomId;
      
      socket.data.roomId = roomId;
      socket.data.displayName = body.displayName;
      socket.data.avatarUrl = body.avatarUrl;
      
      socket.join(`room:${roomId}`);

      await this.presenceService.upsertPresence(roomId, userId, {
        userId,
        displayName: body.displayName,
        avatarUrl: body.avatarUrl,
        currentChapterSlug: room.currentChapterSlug,
      });

      const presences = await this.presenceService.getRoomPresences(roomId);

      socket.emit(ReadingRoomServerEvent.ROOM_SNAPSHOT, {
        room: {
          roomId: room.roomId,
          bookId: room.bookId,
          hostId: room.hostId,
          mode: room.mode,
          currentChapterSlug: room.currentChapterSlug,
          status: room.status,
        },
        members: room.members.map(m => ({ userId: m.userId, role: m.role })),
        presences,
      });

      socket.to(`room:${roomId}`).emit(ReadingRoomServerEvent.MEMBER_JOINED, { userId, displayName: body.displayName });
      this.server.to(`room:${roomId}`).emit(ReadingRoomServerEvent.PRESENCE_UPDATE, presences);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Join failed';
      socket.emit(ReadingRoomServerEvent.ERROR, { code: 'JOIN_FAILED', message });
    }
  }


  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId = socket.data.userId as string;
    const roomId = body.roomId;
    
    try {
      const command = new LeaveRoomCommand(userId, roomId);
      const room = await this.leaveRoomUseCase.execute(command);
      await this.presenceService.removePresence(roomId, userId);
      
      socket.leave(`room:${roomId}`);
      delete socket.data.roomId;

      this.server.to(`room:${roomId}`).emit(ReadingRoomServerEvent.MEMBER_LEFT, { userId });
      
      if (room && room.hostId !== userId) {
         this.server.to(`room:${roomId}`).emit(ReadingRoomServerEvent.HOST_CHANGED, { newHostId: room.hostId });
      }

      const presences = await this.presenceService.getRoomPresences(roomId);
      this.server.to(`room:${roomId}`).emit(ReadingRoomServerEvent.PRESENCE_UPDATE, presences);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Leave failed';
      socket.emit(ReadingRoomServerEvent.ERROR, { code: 'LEAVE_FAILED', message });
    }
  }


  @SubscribeMessage('chapter_change')
  async handleChapterChange(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; chapterSlug: string },
  ) {
    const userId = socket.data.userId as string;
    try {
      const command = new ChangeChapterCommand(userId, body.roomId, body.chapterSlug);
      await this.changeChapterUseCase.execute(command);
      this.server.to(`room:${body.roomId}`).emit(ReadingRoomServerEvent.CHAPTER_CHANGED, {
        chapterSlug: body.chapterSlug,
        byUserId: userId,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Chapter change failed';
      socket.emit(ReadingRoomServerEvent.ERROR, { code: 'CHAPTER_CHANGE_FAILED', message });
    }
  }


  @SubscribeMessage('change_mode')
  async handleChangeMode(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; mode: 'sync' | 'free' },
  ) {
    const userId = socket.data.userId as string;
    try {
      const command = new ChangeRoomModeCommand(userId, body.roomId, body.mode);
      await this.changeRoomModeUseCase.execute(command);
      this.server.to(`room:${body.roomId}`).emit(ReadingRoomServerEvent.MODE_CHANGED, {
        mode: body.mode,
        changedBy: userId,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Mode change failed';
      socket.emit(ReadingRoomServerEvent.ERROR, { code: 'MODE_CHANGE_FAILED', message });
    }
  }


  @SubscribeMessage('end_room')
  async handleEndRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId = socket.data.userId as string;
    try {
      const command = new EndRoomCommand(userId, body.roomId);
      await this.endRoomUseCase.execute(command);
      this.server.to(`room:${body.roomId}`).emit(ReadingRoomServerEvent.ROOM_ENDED, { endedBy: userId });

      const presences = await this.presenceService.getRoomPresences(body.roomId);
      await Promise.all(presences.map((p) => this.presenceService.removePresence(body.roomId, p.userId)));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'End room failed';
      socket.emit(ReadingRoomServerEvent.ERROR, { code: 'END_ROOM_FAILED', message });
    }
  }


  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; chapterSlug: string; paragraphId?: string },
  ) {
    const userId = socket.data.userId as string;
    const { displayName, avatarUrl } = socket.data;

    if (userId && displayName && body.roomId) {
      await this.presenceService.upsertPresence(body.roomId, userId, {
        userId,
        displayName,
        avatarUrl,
        currentChapterSlug: body.chapterSlug,
        paragraphId: body.paragraphId,
      });
      
      const presences = await this.presenceService.getRoomPresences(body.roomId);
      this.server.to(`room:${body.roomId}`).emit(ReadingRoomServerEvent.PRESENCE_UPDATE, presences);
    }
  }

  @SubscribeMessage('paragraph_commented')
  async handleParagraphCommented(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; paragraphId: string; chapterId: string; commentId: string },
  ) {
    const userId = socket.data.userId as string;
    socket.to(`room:${body.roomId}`).emit('annotation_added', {
      paragraphId: body.paragraphId,
      chapterId: body.chapterId,
      commentId: body.commentId,
      user: { userId, displayName: socket.data.displayName }
    });
  }

  @SubscribeMessage('paragraph_comment_deleted')
  async handleParagraphCommentDeleted(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; paragraphId: string; commentId: string },
  ) {
    socket.to(`room:${body.roomId}`).emit('annotation_removed', {
      paragraphId: body.paragraphId,
      commentId: body.commentId,
    });
  }

  @SubscribeMessage('ask_ai')
  async handleAskAI(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string; question: string },
  ) {
    const userId = socket.data.userId as string;
    
    try {
      // Broadcast user message first for immediate feedback
      this.server.to(`room:${data.roomId}`).emit(ReadingRoomServerEvent.NEW_CHAT_MESSAGE, {
        userId,
        role: 'user',
        content: data.question,
        createdAt: new Date(),
      });

      const command = new AskAICommand(data.roomId, userId, data.question);
      await this.askAIUseCase.execute(command);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process AI question';
      socket.emit(ReadingRoomServerEvent.ERROR, { code: 'ASK_AI_FAILED', message });
    }
  }


  @SubscribeMessage('send_chat_message')
  async handleSendChatMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    const userId = socket.data.userId as string;
    this.server.to(`room:${data.roomId}`).emit(ReadingRoomServerEvent.NEW_CHAT_MESSAGE, {
      userId,
      role: 'user',
      content: data.content,
      createdAt: new Date(),
    });
  }
}

