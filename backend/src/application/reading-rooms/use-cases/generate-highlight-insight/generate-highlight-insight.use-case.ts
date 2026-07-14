import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import type { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { GenerateHighlightInsightCommand } from './generate-highlight-insight.command';

@Injectable()
export class GenerateHighlightInsightUseCase {
  private readonly logger = new Logger(GenerateHighlightInsightUseCase.name);

  constructor(
    private readonly readingRoomRepository: IReadingRoomRepository,
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    @Inject(GEMINI_TOKENS.GEMINI_SERVICE)
    private readonly geminiService: IGeminiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: GenerateHighlightInsightCommand) {
    const room = await this.readingRoomRepository.findById(
      RoomId.create(command.roomId),
    );

    if (!room) {
      throw new NotFoundDomainException('Phòng không tồn tại');
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

    const [book, chapter] = await Promise.all([
      this.bookRepository.findById(BookId.create(room.bookId)),
      this.chapterRepository.findBySlug(
        room.currentChapterSlug,
        BookId.create(room.bookId),
      ),
    ]);

    const prompt = `
      Phân tích đoạn văn sau từ cuốn sách "${book?.title?.getValue() || 'Unknown'}" (chương: "${chapter?.title?.getValue() || room.currentChapterSlug}").
      Nội dung có thể là một câu nói hay, một ẩn dụ, một sự kiện lịch sử hoặc một khái niệm khó hiểu.
      Hãy giải thích ý nghĩa hoặc cung cấp thêm thông tin thú vị liên quan.
      
      Ngôn ngữ: Tiếng Việt.
      Độ dài: Tối đa 2 câu.
      
      Đoạn văn: "${highlight.content}"
    `;

    let insight: string;
    try {
      insight = await this.geminiService.generateText(prompt);
    } catch (error) {
      this.logger.warn(
        `Gemini failed for highlight ${command.highlightId}, using fallback. ${error instanceof Error ? error.message : String(error)}`,
      );
      insight = 'Không thể tạo insight ngay lúc này. Vui lòng thử lại sau.';
    }

    room.updateHighlightInsight(highlightIndex, insight);
    await this.readingRoomRepository.save(room);

    // Notify gateway via local event
    this.eventEmitter.emit('reading-room.highlight_insight_updated', {
      roomId: command.roomId,
      highlightId: highlight.id,
      insight,
    });

    return room;
  }
}
