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
import { EventNames } from '@/shared/platform/constants/event-names.constant';
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
      throw new NotFoundDomainException('PhÃ²ng khÃ´ng tá»“n táº¡i');
    }

    if (!room.isMember(command.userId)) {
      throw new ForbiddenDomainException(
        'Báº¡n khÃ´ng pháº£i lÃ  thÃ nh viÃªn cá»§a phÃ²ng nÃ y',
      );
    }

    const highlightIndex = room.highlights.findIndex(
      (h) => h.id === command.highlightId,
    );
    if (highlightIndex === -1) {
      throw new NotFoundDomainException('Highlight khÃ´ng tá»“n táº¡i');
    }

    const highlight = room.highlights[highlightIndex];

    if (highlight.aiInsight) {
      // Already generated
      return room;
    }

    if (room.status === 'ended') {
      throw new ForbiddenDomainException('PhÃ²ng Ä‘Ã£ káº¿t thÃºc');
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
      return room; // Äang sinh bá»Ÿi ngÆ°á»i khÃ¡c, bá» qua
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
        contextBlock = `\nNgá»¯ cáº£nh xung quanh Ä‘oáº¡n vÄƒn:\n${context}\n`;
      }

      const prompt = `
PhÃ¢n tÃ­ch Ä‘oáº¡n vÄƒn sau tá»« cuá»‘n sÃ¡ch "${bookTitle}" (chÆ°Æ¡ng: "${chapterTitle}").
Ná»™i dung cÃ³ thá»ƒ lÃ  má»™t cÃ¢u nÃ³i hay, má»™t áº©n dá»¥, má»™t sá»± kiá»‡n lá»‹ch sá»­ hoáº·c má»™t khÃ¡i niá»‡m khÃ³ hiá»ƒu.
HÃ£y giáº£i thÃ­ch Ã½ nghÄ©a hoáº·c cung cáº¥p thÃªm thÃ´ng tin thÃº vá»‹ liÃªn quan.
${contextBlock}
NgÃ´n ngá»¯: Tiáº¿ng Viá»‡t.
Äá»™ dÃ i: Tá»‘i Ä‘a 2 cÃ¢u.

Äoáº¡n vÄƒn cáº§n phÃ¢n tÃ­ch:
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

        // Cáº­p nháº­t memory object Ä‘á»ƒ tráº£ vá» káº¿t quáº£ má»›i nháº¥t cho caller (tuy caller khÃ´ng báº¯t buá»™c dÃ¹ng insight tá»« returned room)
        room.updateHighlightInsight(highlightIndex, insight);
      }
    } catch (error) {
      this.logger.warn(
        `AI failed for highlight ${command.highlightId}. ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error; // NÃ©m ra Ä‘á»ƒ gateway báº¯t vÃ  emit ERROR cho user
    } finally {
      await this.redis.del(lockKey);
    }

    return room;
  }
}
