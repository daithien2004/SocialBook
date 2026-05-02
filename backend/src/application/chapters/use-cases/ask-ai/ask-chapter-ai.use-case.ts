import { Injectable, Inject, Logger } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import type { IGeminiService } from '@/domain/gemini/services/gemini.service.interface';

import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';

import { AskChapterAICommand } from './ask-chapter-ai.command';

@Injectable()
export class AskChapterAIUseCase {
  private readonly logger = new Logger(AskChapterAIUseCase.name);

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    @Inject(GEMINI_TOKENS.GEMINI_SERVICE)
    private readonly geminiService: IGeminiService,
  ) {}

  async execute(command: AskChapterAICommand) {
    const chapter = await this.chapterRepository.findById(ChapterId.create(command.chapterId));
    if (!chapter) {
      throw new NotFoundDomainException('Chapter not found');
    }

    const book = await this.bookRepository.findBySlug(command.bookSlug);
    if (!book) {
      throw new NotFoundDomainException('Book not found');
    }

    const content = chapter.paragraphs.map(p => p.content).join('\n');

    const prompt = `
      Bạn là một trợ lý đọc sách thông minh.
      Nhiệm vụ của bạn là giải đáp thắc mắc của độc giả về chương sách hiện tại.
      
      Tác phẩm: "${book.title}"
      Chương: "${chapter.title}"
      
      Nội dung chương:
      ${content.substring(0, 5000)}
      
      Câu hỏi của độc giả: "${command.question}"
      
      Hãy trả lời một cách thông minh, sâu sắc, đúng trọng tâm nội dung chương sách. 
      Ngôn ngữ: Tiếng Việt. Độ dài: Ngắn gọn (2-4 câu).
    `;


    const aiResponse = await this.geminiService.generateText(prompt);

    return {
      answer: aiResponse || 'Xin lỗi, tôi không thể tìm thấy câu trả lời phù hợp trong chương này.',
      createdAt: new Date(),
    };

  }
}
