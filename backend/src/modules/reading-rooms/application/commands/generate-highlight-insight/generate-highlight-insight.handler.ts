import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { IChapterRepository } from '@/modules/chapters/domain/public-api';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { BookId } from '@/modules/books/domain/public-api';
import { IAIPort } from '@/modules/ai/domain';
import { getChapterContext } from '@/modules/chapters/application/public-api';
import { GenerateHighlightInsightCommand } from './generate-highlight-insight.command';
import { EventNames } from '@/common/constants/event-names.constant';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

const INSIGHT_LOCK_TTL_SECONDS = 60;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
@CommandHandler(GenerateHighlightInsightCommand)
export class GenerateHighlightInsightHandler implements ICommandHandler<
  GenerateHighlightInsightCommand,
  void
> {
  private readonly logger = new Logger(GenerateHighlightInsightHandler.name);

  constructor(
    private readonly readingRoomRepository: IReadingRoomRepository,
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly aiService: IAIPort,
    private readonly eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async execute(command: GenerateHighlightInsightCommand) {
    const room = await this.readingRoomRepository.findById(
      RoomId.create(command.roomId),
    );

    if (!room) {
      throw new NotFoundDomainException('Phòng không tồn tại');
    }

    if (!room.isMember(command.userId)) {
      throw new ForbiddenDomainException(
        'Bạn không phải là thành viên của phòng này',
      );
    }

    const highlightIndex = room.highlights.findIndex(
      (h) => h.id === command.highlightId,
    );
    if (highlightIndex === -1) {
      throw new NotFoundDomainException('Highlight không tồn tại');
    }

    const highlight = room.highlights[highlightIndex];

    if (highlight.aiInsight) {
      // Already generated
      return room;
    }

    if (room.status === 'ended') {
      throw new ForbiddenDomainException('Phòng đã kết thúc');
    }

    const lockKey = `insight:lock:${command.highlightId}`;
    const gotLock = await this.redis.set(
      lockKey,
      command.userId,
      'EX',
      INSIGHT_LOCK_TTL_SECONDS,
      'NX',
    );
    if (!gotLock) {
      return room; // Đang sinh bởi người khác, bỏ qua
    }

    try {
      const [book, chapter] = await Promise.all([
        this.bookRepository.findById(BookId.create(room.bookId)),
        this.chapterRepository.findBySlug(
          highlight.chapterSlug, // Use highlight's chapter
          BookId.create(room.bookId),
        ),
      ]);

      const bookTitle = book?.title?.getValue() || 'Unknown';
      const chapterTitle = chapter?.title?.getValue() || highlight.chapterSlug;

      const content = highlight.content.slice(0, 500);

      let contextBlock = '';
      if (chapter?.paragraphs?.length) {
        const context = getChapterContext(chapter.paragraphs, content);
        contextBlock = `\nNgữ cảnh xung quanh đoạn văn:\n${context}\n`;
      }

      const prompt = `
Phân tích đoạn văn sau từ cuốn sách "${bookTitle}" (chương: "${chapterTitle}").
Nội dung có thể là một câu nói hay, một ẩn dụ, một sự kiện lịch sử hoặc một khái niệm khó hiểu.
Hãy giải thích ý nghĩa hoặc cung cấp thêm thông tin thú vị liên quan.
${contextBlock}
Ngôn ngữ: Tiếng Việt.
Độ dài: Tối đa 2 câu.

Đoạn văn cần phân tích:
"""
${content}
"""
`;

      const insight = await withTimeout(
        this.aiService.generateText(prompt),
        15_000,
      );

      const saved = await this.readingRoomRepository.setHighlightInsightIfEmpty(
        RoomId.create(command.roomId),
        command.highlightId,
        insight,
      );

      if (saved) {
        // Notify gateway via local event
        this.eventEmitter.emit(
          EventNames.READING_ROOM_HIGHLIGHT_INSIGHT_UPDATED,
          {
            roomId: command.roomId,
            highlightId: highlight.id,
            insight,
          },
        );

        // Cập nhật memory object để trả về kết quả mới nhất cho caller (tuy caller không bắt buộc dùng insight từ returned room)
        room.updateHighlightInsight(highlightIndex, insight);
      }
    } catch (error) {
      this.logger.warn(
        `AI failed for highlight ${command.highlightId}. ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error; // Ném ra để gateway bắt và emit ERROR cho user
    } finally {
      await this.redis.del(lockKey);
    }

    return room;
  }
}
