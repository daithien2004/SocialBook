import { CommandBus } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';

import { WsRateLimiter } from '../core/ws-rate-limiter.service';
import { ReadingRoomEmitter } from './reading-room.emitter';

import { AddHighlightCommand } from '@/application/reading-rooms/commands/add-highlight/add-highlight.command';
import { RemoveHighlightCommand } from '@/application/reading-rooms/commands/remove-highlight/remove-highlight.command';
import { GenerateHighlightInsightCommand } from '@/application/reading-rooms/commands/generate-highlight-insight/generate-highlight-insight.command';
import { ReadingRoomServerEvent } from './reading-room.events';
import { RoomSocket, SocketData } from './reading-room.types';
import { AddHighlightDto } from '../dto/add-highlight.dto';
import { RemoveHighlightDto } from '../dto/remove-highlight.dto';
import { GenerateInsightDto } from '../dto/generate-insight.dto';
import { ErrorCode } from '@/shared/domain/error-codes';

@Injectable()
export class ReadingRoomHighlightHandler {
  private readonly logger = new Logger(ReadingRoomHighlightHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly rateLimiter: WsRateLimiter,
    private readonly emitter: ReadingRoomEmitter,
  ) {}

  handleHighlightInsightUpdated(payload: {
    roomId: string;
    highlightId: string;
    insight: string;
  }) {
    this.emitter
      .toRoom(payload.roomId)
      .emit(ReadingRoomServerEvent.UPDATE_HIGHLIGHT_INSIGHT, {
        highlightId: payload.highlightId,
        insight: payload.insight,
      });
  }

  async handleAddHighlight(
    socket: RoomSocket,
    sd: SocketData,
    body: AddHighlightDto,
  ) {
    const { userId, displayName = '', avatarUrl = '' } = sd;
    const roomId = body.roomId;

    if (await this.rateLimiter.isLimited(userId, 'add_highlight', 30)) {
      this.emitter.emitError(
        socket,
        ErrorCode.RATE_LIMITED,
        'Rate limit exceeded for adding highlights',
      );
      return;
    }
    const command = new AddHighlightCommand(
      roomId,
      userId,
      body.chapterSlug,
      body.paragraphId,
      body.content,
      displayName,
      avatarUrl,
    );
    const room = await this.commandBus.execute(command);

    const newHighlight = room.highlights[room.highlights.length - 1];
    const authorName = newHighlight.displayName || displayName || 'Thành viên';
    const authorAvatar = newHighlight.avatarUrl || avatarUrl || '';

    this.emitter.toRoom(roomId).emit(ReadingRoomServerEvent.NEW_HIGHLIGHT, {
      id: newHighlight.id,
      userId: newHighlight.userId,
      displayName: authorName,
      avatarUrl: authorAvatar,
      chapterSlug: newHighlight.chapterSlug,
      paragraphId: newHighlight.paragraphId,
      content: newHighlight.content,
      aiInsight: newHighlight.aiInsight,
      createdAt: newHighlight.createdAt,
      user: {
        userId: newHighlight.userId,
        displayName: authorName,
        avatarUrl: authorAvatar,
      },
    });
  }

  async handleRemoveHighlight(
    socket: RoomSocket,
    userId: string,
    body: RemoveHighlightDto,
  ) {
    const roomId = body.roomId;

    const command = new RemoveHighlightCommand(
      roomId,
      userId,
      body.highlightId,
    );
    await this.commandBus.execute(command);

    this.emitter.toRoom(roomId).emit(ReadingRoomServerEvent.HIGHLIGHT_REMOVED, {
      highlightId: body.highlightId,
      removedBy: userId,
    });
  }

  async handleGenerateHighlightInsight(
    socket: RoomSocket,
    userId: string,
    body: GenerateInsightDto,
  ) {
    const roomId = body.roomId;

    if (await this.rateLimiter.isLimited(userId, 'generate_insight', 5)) {
      this.emitter.emitError(
        socket,
        ErrorCode.RATE_LIMITED,
        'Rate limit exceeded for generating insights',
      );
      return;
    }

    const command = new GenerateHighlightInsightCommand(
      userId,
      roomId,
      body.highlightId,
    );
    await this.commandBus.execute(command);
  }
}
