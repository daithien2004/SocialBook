import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GenerateHighlightInsightUseCase } from '@/application/reading-rooms/use-cases/generate-highlight-insight/generate-highlight-insight.use-case';
import { GenerateHighlightInsightCommand } from '@/application/reading-rooms/use-cases/generate-highlight-insight/generate-highlight-insight.command';
import { ReadingRoomPresenceService } from './reading-room-presence.service';
import { JoinRoomUseCase } from '@/application/reading-rooms/use-cases/join-room/join-room.use-case';
import { LeaveRoomUseCase } from '@/application/reading-rooms/use-cases/leave-room/leave-room.use-case';
import { ChangeChapterUseCase } from '@/application/reading-rooms/use-cases/change-chapter/change-chapter.use-case';
import { ChangeRoomModeUseCase } from '@/application/reading-rooms/use-cases/change-room-mode/change-room-mode.use-case';
import { EndRoomUseCase } from '@/application/reading-rooms/use-cases/end-room/end-room.use-case';
import { DeleteRoomUseCase } from '@/application/reading-rooms/use-cases/delete-room/delete-room.use-case';
import { DeleteRoomCommand } from '@/application/reading-rooms/use-cases/delete-room/delete-room.command';
import { JoinRoomCommand } from '@/application/reading-rooms/use-cases/join-room/join-room.command';
import { LeaveRoomCommand } from '@/application/reading-rooms/use-cases/leave-room/leave-room.command';
import { ChangeChapterCommand } from '@/application/reading-rooms/use-cases/change-chapter/change-chapter.command';
import { ChangeRoomModeCommand } from '@/application/reading-rooms/use-cases/change-room-mode/change-room-mode.command';
import { EndRoomCommand } from '@/application/reading-rooms/use-cases/end-room/end-room.command';
import { AddHighlightUseCase } from '@/application/reading-rooms/use-cases/add-highlight/add-highlight.use-case';
import { AddHighlightCommand } from '@/application/reading-rooms/use-cases/add-highlight/add-highlight.command';
import { RemoveHighlightUseCase } from '@/application/reading-rooms/use-cases/remove-highlight/remove-highlight.use-case';
import { RemoveHighlightCommand } from '@/application/reading-rooms/use-cases/remove-highlight/remove-highlight.command';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ReadingRoomServerEvent,
  ReadingRoomClientEvent,
} from './reading-room.events';
import { UpdateProgressUseCase } from '@/application/library/use-cases/update-progress/update-progress.use-case';
import { UpdateProgressCommand } from '@/application/library/use-cases/update-progress/update-progress.command';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { BookId as ChapterBookId } from '@/domain/chapters/value-objects/book-id.vo';
import { AddCommentUseCase } from '@/application/reading-room-interactions/use-cases/add-comment/add-comment.use-case';
import { AddCommentCommand } from '@/application/reading-room-interactions/use-cases/add-comment/add-comment.command';
import { DeleteCommentUseCase } from '@/application/reading-room-interactions/use-cases/delete-comment/delete-comment.use-case';
import { DeleteCommentCommand } from '@/application/reading-room-interactions/use-cases/delete-comment/delete-comment.command';
import { AddReactionUseCase } from '@/application/reading-room-interactions/use-cases/add-reaction/add-reaction.use-case';
import { AddReactionCommand } from '@/application/reading-room-interactions/use-cases/add-reaction/add-reaction.command';
import { AddQuoteUseCase } from '@/application/reading-room-interactions/use-cases/add-quote/add-quote.use-case';
import { AddQuoteCommand } from '@/application/reading-room-interactions/use-cases/add-quote/add-quote.command';
import { VoteQuoteUseCase } from '@/application/reading-room-interactions/use-cases/vote-quote/vote-quote.use-case';
import { VoteQuoteCommand } from '@/application/reading-room-interactions/use-cases/vote-quote/vote-quote.command';

interface SocketData {
  userId?: string;
  displayName?: string;
  avatarUrl?: string;
  roomId?: string;
}

@WebSocketGateway({
  namespace: '/reading-rooms',
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
  maxHttpBufferSize: 1e6,
})
export class ReadingRoomGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ReadingRoomGateway.name);
  private readonly eventTimestamps = new Map<string, number>();

  // Track last saved progress per userId:chapterSlug to avoid spamming DB
  private readonly lastSavedProgress = new Map<string, number>();

  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly presenceService: ReadingRoomPresenceService,
    private readonly joinRoomUseCase: JoinRoomUseCase,
    private readonly leaveRoomUseCase: LeaveRoomUseCase,
    private readonly changeChapterUseCase: ChangeChapterUseCase,
    private readonly changeRoomModeUseCase: ChangeRoomModeUseCase,
    private readonly endRoomUseCase: EndRoomUseCase,
    private readonly deleteRoomUseCase: DeleteRoomUseCase,
    private readonly addHighlightUseCase: AddHighlightUseCase,
    private readonly removeHighlightUseCase: RemoveHighlightUseCase,
    private readonly addCommentUseCase: AddCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly addReactionUseCase: AddReactionUseCase,
    private readonly addQuoteUseCase: AddQuoteUseCase,
    private readonly voteQuoteUseCase: VoteQuoteUseCase,
    private readonly generateHighlightInsightUseCase: GenerateHighlightInsightUseCase,
    private readonly updateProgressUseCase: UpdateProgressUseCase,
    private readonly chapterRepository: IChapterRepository,
  ) {}

  private async saveReadingProgress(
    userId: string,
    bookId: string,
    chapterId: string | undefined,
    chapterSlug: string,
    progress: number,
  ): Promise<void> {
    if (!chapterId) {
      try {
        const chapter = await this.chapterRepository.findBySlug(
          chapterSlug,
          ChapterBookId.create(bookId),
        );
        if (!chapter) return;
        chapterId = chapter.id.toString();
      } catch {
        return;
      }
    }
    try {
      await this.updateProgressUseCase.execute(
        new UpdateProgressCommand(userId, bookId, chapterId, progress),
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to save reading progress for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @OnEvent('reading-room.highlight_insight_updated')
  handleHighlightInsightUpdated(payload: {
    roomId: string;
    highlightId: string;
    insight: string;
  }) {
    this.server
      .to(`room:${payload.roomId}`)
      .emit(ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT, {
        highlightId: payload.highlightId,
        insight: payload.insight,
      });
  }

  @OnEvent('reading-room.chat_message_added')
  handleChatMessageAdded(payload: {
    roomId: string;
    message: { userId: string; role: string; content: string; createdAt: Date };
  }) {
    this.server
      .to(`room:${payload.roomId}`)
      .emit('new_chat_message', payload.message);
  }

  @SubscribeMessage('add_highlight')
  async handleAddHighlight(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      roomId: string;
      chapterSlug: string;
      paragraphId: string;
      content: string;
    },
  ) {
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';
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

      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.NEW_HIGHLIGHT, {
          ...newHighlight,
          user: {
            userId,
            displayName: sd.displayName ?? '',
            avatarUrl: sd.avatarUrl ?? '',
          },
        });
    } catch (error: unknown) {
      this.emitError(socket, 'HIGHLIGHT_FAILED', 'Highlight failed', error);
    }
  }

  @SubscribeMessage(ReadingRoomClientEvent.REMOVE_HIGHLIGHT)
  async handleRemoveHighlight(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; highlightId: string },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new RemoveHighlightCommand(
        body.roomId,
        userId,
        body.highlightId,
      );
      await this.removeHighlightUseCase.execute(command);

      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.HIGHLIGHT_REMOVED, {
          highlightId: body.highlightId,
          removedBy: userId,
        });
    } catch (error: unknown) {
      this.emitError(
        socket,
        'HIGHLIGHT_REMOVE_FAILED',
        'Remove highlight failed',
        error,
      );
    }
  }

  @SubscribeMessage('generate_highlight_insight')
  async handleGenerateHighlightInsight(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; highlightId: string },
  ) {
    try {
      const command = new GenerateHighlightInsightCommand(
        body.roomId,
        body.highlightId,
      );
      // Generate AI Insight. The use-case will emit 'reading-room.highlight_insight_updated'
      // which will then be broadcasted to the room.
      await this.generateHighlightInsightUseCase.execute(command);
    } catch (error: unknown) {
      this.emitError(
        socket,
        'GENERATE_INSIGHT_FAILED',
        'Generate insight failed',
        error,
      );
    }
  }

  handleConnection(socket: Socket) {
    try {
      const auth = socket.handshake.auth as { token?: string };
      const query = socket.handshake.query as { token?: string };

      const token = auth?.token ?? query?.token;

      if (typeof token !== 'string' || !token) {
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
    } catch {
      // Socket connection error handled by disconnect below
      socket.disconnect(true);
    }
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    const sd = socket.data as SocketData;
    const userId = sd.userId;
    const roomId = sd.roomId;

    if (userId && roomId) {
      await this.presenceService.removePresence(roomId, userId);
      const roomPresences = await this.presenceService.getRoomPresences(roomId);
      this.server
        .to(`room:${roomId}`)
        .emit(ReadingRoomServerEvent.PRESENCE_UPDATE, roomPresences);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: { roomCode: string; displayName: string; avatarUrl: string },
  ) {
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';
    try {
      const command = new JoinRoomCommand(userId, body.roomCode);
      const room = await this.joinRoomUseCase.execute(command);
      const roomId = room.roomId;

      sd.roomId = roomId;
      sd.displayName = body.displayName;
      sd.avatarUrl = body.avatarUrl;

      void socket.join(`room:${roomId}`);

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
          highlights: room.highlights.map((h) => ({
            id: h.id,
            userId: h.userId,
            chapterSlug: h.chapterSlug,
            paragraphId: h.paragraphId,
            content: h.content,
            aiInsight: h.aiInsight,
            createdAt: h.createdAt,
          })),
          chatMessages: room.chatMessages,
        },
        members: room.members.map((m) => ({ userId: m.userId, role: m.role })),
        presences,
      });

      socket.to(`room:${roomId}`).emit(ReadingRoomServerEvent.MEMBER_JOINED, {
        userId,
        displayName: body.displayName,
      });
      this.server
        .to(`room:${roomId}`)
        .emit(ReadingRoomServerEvent.PRESENCE_UPDATE, presences);
    } catch (error: unknown) {
      this.emitError(socket, 'JOIN_FAILED', 'Join failed', error);
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; newHostId?: string },
  ) {
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';
    const roomId = body.roomId;

    try {
      const command = new LeaveRoomCommand(userId, roomId, body.newHostId);
      const room = await this.leaveRoomUseCase.execute(command);
      await this.presenceService.removePresence(roomId, userId);

      void socket.leave(`room:${roomId}`);
      delete sd.roomId;

      if (body.newHostId) {
        this.server
          .to(`room:${roomId}`)
          .emit(ReadingRoomServerEvent.HOST_CHANGED, {
            newHostId: body.newHostId,
          });
      }

      this.server
        .to(`room:${roomId}`)
        .emit(ReadingRoomServerEvent.MEMBER_LEFT, { userId });

      const presences = await this.presenceService.getRoomPresences(roomId);
      this.server
        .to(`room:${roomId}`)
        .emit(ReadingRoomServerEvent.PRESENCE_UPDATE, presences);
    } catch (error: unknown) {
      this.emitError(socket, 'LEAVE_FAILED', 'Leave failed', error);
    }
  }

  @SubscribeMessage('chapter_change')
  async handleChapterChange(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      roomId: string;
      chapterSlug: string;
      bookId?: string;
      chapterId?: string;
    },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new ChangeChapterCommand(
        userId,
        body.roomId,
        body.chapterSlug,
      );
      await this.changeChapterUseCase.execute(command);

      // Save progress as 0 when starting a new chapter
      if (body.bookId) {
        this.lastSavedProgress.set(
          `${userId}:${body.chapterSlug}`,
          0,
        );
        await this.saveReadingProgress(
          userId,
          body.bookId,
          body.chapterId,
          body.chapterSlug,
          0,
        );
      }

      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.CHAPTER_CHANGED, {
          chapterSlug: body.chapterSlug,
          byUserId: userId,
        });
    } catch (error: unknown) {
      this.emitError(
        socket,
        'CHAPTER_CHANGE_FAILED',
        'Chapter change failed',
        error,
      );
    }
  }

  @SubscribeMessage('change_mode')
  async handleChangeMode(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; mode: 'sync' | 'free' },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new ChangeRoomModeCommand(userId, body.roomId, body.mode);
      await this.changeRoomModeUseCase.execute(command);
      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.MODE_CHANGED, {
          mode: body.mode,
          changedBy: userId,
        });
    } catch (error: unknown) {
      this.emitError(socket, 'MODE_CHANGE_FAILED', 'Mode change failed', error);
    }
  }

  @SubscribeMessage('end_room')
  async handleEndRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new EndRoomCommand(userId, body.roomId);
      await this.endRoomUseCase.execute(command);
      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.ROOM_ENDED, { endedBy: userId });

      const presences = await this.presenceService.getRoomPresences(
        body.roomId,
      );
      await Promise.all(
        presences.map((p) =>
          this.presenceService.removePresence(body.roomId, p.userId),
        ),
      );
    } catch (error: unknown) {
      this.emitError(socket, 'END_ROOM_FAILED', 'End room failed', error);
    }
  }

  @SubscribeMessage('delete_room')
  async handleDeleteRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new DeleteRoomCommand(userId, body.roomId);
      await this.deleteRoomUseCase.execute(command);
      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.ROOM_DELETED, { deletedBy: userId });
    } catch (error: unknown) {
      this.emitError(socket, 'DELETE_ROOM_FAILED', 'Delete room failed', error);
    }
  }

  private emitError(
    socket: Socket,
    code: string,
    defaultMsg: string,
    error: unknown,
  ) {
    socket.emit(ReadingRoomServerEvent.ERROR, {
      code,
      message: error instanceof Error ? error.message : defaultMsg,
    });
  }

  private isRateLimited(
    socket: Socket,
    event: string,
    maxPerMinute = 30,
  ): boolean {
    const key = `${socket.id}:${event}`;
    const now = Date.now();
    const last = this.eventTimestamps.get(key) || 0;
    const minInterval = 60_000 / maxPerMinute;
    if (now - last < minInterval) {
      return true;
    }
    this.eventTimestamps.set(key, now);
    return false;
  }

  @SubscribeMessage('party:selection_update')
  handleSelectionUpdate(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      roomId: string;
      paragraphId: string;
      startOffset: number;
      endOffset: number;
    },
  ) {
    if (this.isRateLimited(socket, 'party:selection_update', 60)) return;
    const sd = socket.data as SocketData;
    const { userId, displayName, avatarUrl } = sd;
    if (!userId || !body.roomId) return;

    socket.to(`room:${body.roomId}`).emit(
      ReadingRoomServerEvent.PARTY_REMOTE_SELECTION,
      {
        userId,
        displayName: displayName ?? '',
        avatarUrl: avatarUrl ?? '',
        paragraphId: body.paragraphId,
        startOffset: body.startOffset,
        endOffset: body.endOffset,
      },
    );
  }

  @SubscribeMessage('party:selection_cleared')
  handleSelectionCleared(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const sd = socket.data as SocketData;
    const { userId } = sd;
    if (!userId || !body.roomId) return;

    socket.to(`room:${body.roomId}`).emit(
      ReadingRoomServerEvent.PARTY_REMOTE_SELECTION,
      {
        userId,
        displayName: '',
        avatarUrl: '',
        paragraphId: null,
        startOffset: 0,
        endOffset: 0,
      },
    );
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      roomId: string;
      chapterSlug: string;
      paragraphId?: string;
      progress?: number;
      bookId?: string;
      chapterId?: string;
    },
  ) {
    if (this.isRateLimited(socket, 'heartbeat', 30)) return;
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';
    const displayName = sd.displayName ?? '';
    const avatarUrl = sd.avatarUrl ?? '';

    if (userId && displayName && body.roomId) {
      await this.presenceService.upsertPresence(body.roomId, userId, {
        userId,
        displayName,
        avatarUrl,
        currentChapterSlug: body.chapterSlug,
        paragraphId: body.paragraphId,
        progress: body.progress,
      });

      // Save reading progress when threshold met
      if (
        body.bookId &&
        body.chapterId &&
        body.progress !== undefined
      ) {
        const cacheKey = `${userId}:${body.chapterSlug}`;
        const lastSaved = this.lastSavedProgress.get(cacheKey) ?? -1;
        if (
          body.progress - lastSaved >= 10 ||
          body.progress === 100
        ) {
          this.lastSavedProgress.set(cacheKey, body.progress);
          await this.saveReadingProgress(
            userId,
            body.bookId,
            body.chapterId,
            body.chapterSlug,
            body.progress,
          );
        }
      }

      const presences = await this.presenceService.getRoomPresences(
        body.roomId,
      );
      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.PRESENCE_UPDATE, presences);
    }
  }

  @SubscribeMessage('paragraph_commented')
  handleParagraphCommented(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      roomId: string;
      paragraphId: string;
      chapterId: string;
      commentId: string;
    },
  ) {
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';
    socket.to(`room:${body.roomId}`).emit('annotation_added', {
      paragraphId: body.paragraphId,
      chapterId: body.chapterId,
      commentId: body.commentId,
      user: { userId, displayName: sd.displayName ?? '' },
    });
  }

  @SubscribeMessage('paragraph_comment_deleted')
  handleParagraphCommentDeleted(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: { roomId: string; paragraphId: string; commentId: string },
  ) {
    socket.to(`room:${body.roomId}`).emit('annotation_removed', {
      paragraphId: body.paragraphId,
      commentId: body.commentId,
    });
  }

  @SubscribeMessage('send_chat_message')
  handleSendChatMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    if (this.isRateLimited(socket, 'send_chat_message', 30)) {
      socket.emit(ReadingRoomServerEvent.ERROR, {
        code: 'RATE_LIMITED',
        message: 'Bạn đang gửi tin nhắn quá nhanh, vui lòng chậm lại.',
      });
      return;
    }
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';
    const displayName = sd.displayName || 'User';
    const avatarUrl = sd.avatarUrl || '';
    this.server
      .to(`room:${data.roomId}`)
      .emit(ReadingRoomServerEvent.NEW_CHAT_MESSAGE, {
        userId,
        displayName,
        avatarUrl,
        role: 'user',
        content: data.content,
        createdAt: new Date(),
      });
  }

  @OnEvent('reading-room.reactivated')
  handleRoomReactivated(payload: {
    roomId: string;
    reactivatedBy: string;
  }) {
    this.server
      .to(`room:${payload.roomId}`)
      .emit(ReadingRoomServerEvent.ROOM_REACTIVATED, {
        reactivatedBy: payload.reactivatedBy,
      });
  }

  @SubscribeMessage(ReadingRoomClientEvent.ADD_COMMENT)
  async handleAddComment(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      roomId: string;
      chapterSlug: string;
      paragraphId: string;
      content: string;
      parentCommentId?: string;
    },
  ) {
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';
    try {
      const command = new AddCommentCommand(
        userId,
        body.roomId,
        body.chapterSlug,
        body.paragraphId,
        body.content,
        body.parentCommentId,
      );
      const comment = await this.addCommentUseCase.execute(command);
      const displayName = sd.displayName || 'User';

      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.COMMENT_ADDED, {
          id: comment.id,
          paragraphId: comment.paragraphId,
          chapterSlug: comment.chapterSlug,
          content: comment.content,
          parentCommentId: comment.parentCommentId,
          userId,
          displayName,
          createdAt: comment.createdAt,
        });
    } catch (error: unknown) {
      this.emitError(socket, 'COMMENT_FAILED', 'Add comment failed', error);
    }
  }

  @SubscribeMessage(ReadingRoomClientEvent.DELETE_COMMENT)
  async handleDeleteComment(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: { roomId: string; commentId: string; paragraphId: string },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new DeleteCommentCommand(
        userId,
        body.commentId,
        body.roomId,
        body.paragraphId,
      );
      await this.deleteCommentUseCase.execute(command);

      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.COMMENT_DELETED, {
          commentId: body.commentId,
          paragraphId: body.paragraphId,
        });
    } catch (error: unknown) {
      this.emitError(
        socket,
        'COMMENT_DELETE_FAILED',
        'Delete comment failed',
        error,
      );
    }
  }

  @SubscribeMessage(ReadingRoomClientEvent.ADD_REACTION)
  async handleAddReaction(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      roomId: string;
      chapterSlug: string;
      paragraphId: string;
      reactionType: string;
    },
  ) {
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';
    try {
      const command = new AddReactionCommand(
        userId,
        body.roomId,
        body.chapterSlug,
        body.paragraphId,
        body.reactionType,
      );
      const reaction = await this.addReactionUseCase.execute(command);
      const displayName = sd.displayName || 'User';

      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.REACTION_ADDED, {
          id: reaction.id,
          paragraphId: reaction.paragraphId,
          reactionType: reaction.reactionType,
          userId,
          displayName,
          createdAt: reaction.createdAt,
        });
    } catch (error: unknown) {
      this.emitError(socket, 'REACTION_FAILED', 'Add reaction failed', error);
    }
  }

  @SubscribeMessage(ReadingRoomClientEvent.ADD_QUOTE)
  async handleAddQuote(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      roomId: string;
      chapterSlug: string;
      paragraphId: string;
      content: string;
    },
  ) {
    const sd = socket.data as SocketData;
    const userId = sd.userId ?? '';
    try {
      const command = new AddQuoteCommand(
        userId,
        body.roomId,
        body.chapterSlug,
        body.paragraphId,
        body.content,
      );
      const quote = await this.addQuoteUseCase.execute(command);

      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.QUOTE_ADDED, {
          id: quote.id,
          content: quote.content,
          chapterSlug: quote.chapterSlug,
          paragraphId: quote.paragraphId,
          userId,
          displayName: sd.displayName ?? '',
          voteCount: 0,
          createdAt: quote.createdAt,
        });
    } catch (error: unknown) {
      this.emitError(socket, 'QUOTE_FAILED', 'Add quote failed', error);
    }
  }

  @SubscribeMessage(ReadingRoomClientEvent.VOTE_QUOTE)
  async handleVoteQuote(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: { roomId: string; quoteId: string; voteType: 'up' | 'down' },
  ) {
    const userId = (socket.data as SocketData).userId ?? '';
    try {
      const command = new VoteQuoteCommand(
        userId,
        body.roomId,
        body.quoteId,
        body.voteType,
      );
      const result = await this.voteQuoteUseCase.execute(command);

      this.server
        .to(`room:${body.roomId}`)
        .emit(ReadingRoomServerEvent.QUOTE_VOTED, {
          quoteId: body.quoteId,
          voteCount: result.voteCount,
          userId,
          voteType: result.userVoteType,
        });
    } catch (error: unknown) {
      this.emitError(socket, 'QUOTE_VOTE_FAILED', 'Vote quote failed', error);
    }
  }
}
