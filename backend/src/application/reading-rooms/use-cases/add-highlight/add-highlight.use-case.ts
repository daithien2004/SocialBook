import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import type { IGeminiService } from '@/domain/gemini/services/gemini.service.interface';


import { AddHighlightCommand } from './add-highlight.command';

@Injectable()
export class AddHighlightUseCase {
  private readonly logger = new Logger(AddHighlightUseCase.name);

  constructor(
    private readonly readingRoomRepository: IReadingRoomRepository,
    @Inject(GEMINI_TOKENS.GEMINI_SERVICE)
    private readonly geminiService: IGeminiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}


  async execute(command: AddHighlightCommand) {
    const room = await this.readingRoomRepository.findById(RoomId.create(command.roomId));

    if (!room) {
      throw new NotFoundDomainException('Reading room not found');
    }

    room.addHighlight({
      userId: command.userId,
      chapterSlug: command.chapterSlug,
      paragraphId: command.paragraphId,
      content: command.content,
    });

    const highlightIndex = room.highlights.length - 1;
    await this.readingRoomRepository.save(room);

    // Asynchronously generate AI Insight
    this.generateAIInsight(command.roomId, highlightIndex, command.content).catch(err => {
      this.logger.error(`Failed to generate AI insight: ${err.message}`);
    });

    return room;
  }

  private async generateAIInsight(roomId: string, highlightIndex: number, content: string) {
    const prompt = `
      Phân tích đoạn văn sau từ một cuốn sách và cung cấp một nhận xét ngắn gọn (AI Insight).
      Nội dung có thể là một câu nói hay, một ẩn dụ, một sự kiện lịch sử hoặc một khái niệm khó hiểu.
      Hãy giải thích ý nghĩa hoặc cung cấp thêm thông tin thú vị liên quan.
      
      Ngôn ngữ: Tiếng Việt.
      Độ dài: Tối đa 2 câu.
      
      Đoạn văn: "${content}"
    `;

    const insight = await this.geminiService.generateText(prompt);
    
    const room = await this.readingRoomRepository.findById(RoomId.create(roomId));

    if (room) {
      room.updateHighlightInsight(highlightIndex, insight);
      await this.readingRoomRepository.save(room);
      
      // Notify gateway via local event
      const highlight = room.highlights[highlightIndex];
      this.eventEmitter.emit('reading-room.highlight_insight_updated', {
        roomId,
        highlightId: highlight.id,
        insight,
      });
    }

  }
}
