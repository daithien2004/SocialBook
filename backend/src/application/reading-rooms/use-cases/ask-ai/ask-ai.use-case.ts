import { Injectable, Inject, Logger } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';

import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import {
  ChatMessageProps,
  RoomHighlightProps,
} from '@/domain/reading-rooms/entities/reading-room.entity';

import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import type { IGeminiService } from '@/domain/gemini/services/gemini.service.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { AskAICommand } from './ask-ai.command';

@Injectable()
export class AskAIUseCase {
  private readonly logger = new Logger(AskAIUseCase.name);

  constructor(
    private readonly readingRoomRepository: IReadingRoomRepository,
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    @Inject(GEMINI_TOKENS.GEMINI_SERVICE)
    private readonly geminiService: IGeminiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: AskAICommand) {
    const room = await this.readingRoomRepository.findById(RoomId.create(command.roomId));
    if (!room) {
      throw new NotFoundDomainException('Reading room not found');
    }

    // 1. Add user message to history
    room.addChatMessage({
      userId: command.userId,
      role: 'user',
      content: command.question,
    });
    await this.readingRoomRepository.save(room);

    // 2. Fire-and-forget AI response — pass context from already-loaded room
    //    to avoid an extra fetch at the start of the background task.
    this.generateAIResponse({
      roomId: command.roomId,
      question: command.question,
      bookId: room.bookId,
      currentChapterSlug: room.currentChapterSlug,
      highlights: room.highlights,
      chatMessages: room.chatMessages,
    }).catch((err) => {
      this.logger.error(
        `AI Chat background task failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    return { success: true };
  }

  private async generateAIResponse(ctx: {
    roomId: string;
    question: string;
    bookId: string;
    currentChapterSlug: string;
    highlights: RoomHighlightProps[];
    chatMessages: ChatMessageProps[];
  }) {
    // Get book slug for chapter lookup
    const book = await this.bookRepository.findById(BookId.create(ctx.bookId));
    if (!book) return;

    // Get chapter content for context
    const chapterDetail = await this.chapterRepository.findDetailBySlug(
      ctx.currentChapterSlug,
      book.slug,
    );
    const content = chapterDetail
      ? chapterDetail.chapter.paragraphs.map((p) => p.content).join('\n')
      : '';

    const highlightsContext = ctx.highlights
      .map((h) => `- "${h.content}": ${h.aiInsight || 'No insight yet'}`)
      .join('\n');

    const chatHistory = ctx.chatMessages
      .slice(-10)
      .map((m) => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`)
      .join('\n');

    const prompt = `
      Bạn là một trợ lý đọc sách thông minh trong một phòng đọc cộng tác.
      Nhiệm vụ của bạn là giải đáp thắc mắc của độc giả về chương sách hiện tại.
      
      Ngữ cảnh chương đang đọc:
      ${content.substring(0, 4000)}
      
      Các đoạn quan trọng nhóm đã highlight:
      ${highlightsContext}
      
      Lịch sử trò chuyện gần đây:
      ${chatHistory}
      
      Câu hỏi mới nhất: "${ctx.question}"
      
      Hãy trả lời một cách thông minh, sâu sắc và khuyến khích thảo luận. 
      Ngôn ngữ: Tiếng Việt. Độ dài: Ngắn gọn (2-4 câu).
    `;

    const aiResponse = await this.geminiService.generateText(prompt);

    // Fetch fresh room to safely append AI response
    const updatedRoom = await this.readingRoomRepository.findById(RoomId.create(ctx.roomId));
    if (updatedRoom) {
      updatedRoom.addChatMessage({
        userId: 'gemini-ai',
        role: 'ai',
        content: aiResponse,
      });
      await this.readingRoomRepository.save(updatedRoom);

      this.eventEmitter.emit('reading-room.chat_message_added', {
        roomId: ctx.roomId,
        message: {
          userId: 'gemini-ai',
          role: 'ai',
          content: aiResponse,
          createdAt: new Date(),
        },
      });
    }
  }
}
