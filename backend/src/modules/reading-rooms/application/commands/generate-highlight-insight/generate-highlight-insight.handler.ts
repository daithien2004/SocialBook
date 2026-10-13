import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IAIPort } from '@/modules/ai';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { getChapterContext } from '@/modules/chapters/application/public-api';
import { IChapterRepository } from '@/modules/chapters/domain/public-api';
import { IHighlightInsightLockPort } from '@/modules/reading-rooms/application/ports/external/highlight-insight-lock.port';
import { IHighlightInsightStore } from '@/modules/reading-rooms/application/ports/persistence/highlight-insight.store';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { BookId } from '@/modules/books/domain/public-api';
import { GenerateHighlightInsightCommand } from './generate-highlight-insight.command';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { EventNames } from '@/shared/platform/constants/event-names.constant';

const AI_REQUEST_TIMEOUT_MS = 15_000;

async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutError = new Error(`AI request timed out after ${timeoutMs}ms`);
  const request = operation(controller.signal);
  const timeout = new Promise<never>(() => {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([request, timeout]);
    if (controller.signal.aborted) throw timeoutError;
    return result;
  } catch (error: unknown) {
    if (controller.signal.aborted) throw timeoutError;
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

@CommandHandler(GenerateHighlightInsightCommand)
export class GenerateHighlightInsightHandler implements ICommandHandler<
  GenerateHighlightInsightCommand,
  void
> {
  private readonly logger = new Logger(GenerateHighlightInsightHandler.name);

  constructor(
    private readonly readingRoomRepository: IReadingRoomRepository,
    private readonly highlightInsightStore: IHighlightInsightStore,
    private readonly insightLock: IHighlightInsightLockPort,
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly aiService: IAIPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: GenerateHighlightInsightCommand): Promise<void> {
    const roomId = RoomId.create(command.roomId);
    const room = await this.readingRoomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundDomainException('Phòng không tồn tại');
    }

    if (!room.isMember(command.userId)) {
      throw new ForbiddenDomainException(
        'Bạn không phải là thành viên của phòng này',
      );
    }

    const highlight = room.highlights.find(
      (item) => item.id === command.highlightId,
    );
    if (!highlight) {
      throw new NotFoundDomainException('Highlight không tồn tại');
    }

    if (highlight.aiInsight) return;

    if (room.status === 'ended') {
      throw new ForbiddenDomainException('Phòng đã kết thúc');
    }

    const lockToken = randomUUID();
    const lockAcquired = await this.insightLock.tryAcquire(
      command.roomId,
      command.highlightId,
      lockToken,
    );
    if (!lockAcquired) return;

    try {
      const bookId = BookId.create(room.bookId);
      const [book, chapter] = await Promise.all([
        this.bookRepository.findById(bookId),
        this.chapterRepository.findBySlug(highlight.chapterSlug, bookId),
      ]);

      const bookTitle = book?.title?.getValue() ?? 'Không rõ tên sách';
      const chapterTitle = chapter?.title?.getValue() ?? highlight.chapterSlug;
      const content = highlight.content.slice(0, 500);
      const contextBlock = chapter?.paragraphs.length
        ? `\nNgữ cảnh xung quanh đoạn văn:\n${getChapterContext(chapter.paragraphs, content)}\n`
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

      const insight = await withTimeout(
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
