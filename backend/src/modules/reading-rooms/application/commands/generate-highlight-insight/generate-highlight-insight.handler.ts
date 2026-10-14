import { randomUUID } from 'node:crypto';
import { ForbiddenError, subject } from '@casl/ability';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IAIPort } from '@/modules/ai';
import { GetReadingRoomChapterContextQuery } from '@/modules/chapters';
import { HighlightInsightLockPort } from '@/modules/reading-rooms/application/ports/external/highlight-insight-lock.port';
import { HighlightInsightStore } from '@/modules/reading-rooms/application/ports/persistence/highlight-insight.store';
import { ReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { GenerateHighlightInsightCommand } from './generate-highlight-insight.command';
import {
  ReadingRoomForbiddenError,
  ReadingRoomNotFoundError,
} from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { EventNames } from '@/shared/platform/constants/event-names.constant';
import { runWithAbortTimeout } from './run-with-abort-timeout';

const AI_REQUEST_TIMEOUT_MS = 15_000;

@CommandHandler(GenerateHighlightInsightCommand)
export class GenerateHighlightInsightHandler implements ICommandHandler<
  GenerateHighlightInsightCommand,
  void
> {
  private readonly logger = new Logger(GenerateHighlightInsightHandler.name);

  constructor(
    private readonly readingRoomRepository: ReadingRoomRepository,
    private readonly highlightInsightStore: HighlightInsightStore,
    private readonly insightLock: HighlightInsightLockPort,
    private readonly queryBus: QueryBus,
    private readonly aiService: IAIPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: GenerateHighlightInsightCommand): Promise<void> {
    const roomId = RoomId.create(command.roomId);
    const room = await this.readingRoomRepository.findById(roomId);
    if (!room) {
      throw new ReadingRoomNotFoundError('Phòng không tồn tại');
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('ReadingRoomMember', {
        roomId: room.roomId,
        userId: command.actor.userId,
      }),
    );

    if (!room.isMember(command.actor.userId)) {
      throw new ReadingRoomForbiddenError(
        'Bạn không phải là thành viên của phòng này',
      );
    }

    const highlight = room.highlights.find(
      (item) => item.id === command.highlightId,
    );
    if (!highlight) {
      throw new ReadingRoomNotFoundError('Highlight không tồn tại');
    }

    if (highlight.aiInsight) return;

    if (room.status === 'ended') {
      throw new ReadingRoomForbiddenError('Phòng đã kết thúc');
    }

    const lockToken = randomUUID();
    const lockAcquired = await this.insightLock.tryAcquire(
      command.roomId,
      command.highlightId,
      lockToken,
    );
    if (!lockAcquired) return;

    try {
      const chapter = await this.queryBus.execute(
        new GetReadingRoomChapterContextQuery(
          command.actor,
          room.bookId,
          highlight.chapterSlug,
          highlight.content.slice(0, 500),
        ),
      );
      const bookTitle = chapter?.bookTitle ?? 'Không rõ tên sách';
      const chapterTitle = chapter?.chapterTitle ?? highlight.chapterSlug;
      const content = highlight.content.slice(0, 500);
      const contextBlock = chapter?.context
        ? `\nNgữ cảnh xung quanh đoạn văn:\n${chapter.context}\n`
        : '';
      const prompt = [
        `Phân tích đoạn văn sau từ cuốn sách "${bookTitle}" (chương: "${chapterTitle}").`,
        'Nội dung có thể là một câu nói hay, một ẩn dụ, một sự kiện lịch sử hoặc một khái niệm khó hiểu.',
        'Hãy giải thích ý nghĩa hoặc cung cấp thêm thông tin thú vị liên quan.',
        contextBlock,
        'Ngôn ngữ: Tiếng Việt.',
        'Độ dài: Tối đa 2 câu.',
        '',
        'Đoạn văn cần phân tích:',
        '"""',
        content,
        '"""',
      ].join('\n');

      const insight = await runWithAbortTimeout(
        (signal) => this.aiService.generateText(prompt, undefined, signal),
        AI_REQUEST_TIMEOUT_MS,
      );
      const saved = await this.highlightInsightStore.setIfEmpty(
        roomId,
        command.highlightId,
        insight,
      );

      if (saved) {
        this.eventEmitter.emit(
          EventNames.READING_ROOM_HIGHLIGHT_INSIGHT_UPDATED,
          {
            roomId: command.roomId,
            highlightId: highlight.id,
            insight,
          },
        );
      }
    } catch (error: unknown) {
      this.logger.warn(
        `AI insight generation failed for highlight ${command.highlightId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      try {
        await this.insightLock.release(
          command.roomId,
          command.highlightId,
          lockToken,
        );
      } catch (error: unknown) {
        this.logger.warn(
          `Failed to release insight lock for highlight ${command.highlightId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
