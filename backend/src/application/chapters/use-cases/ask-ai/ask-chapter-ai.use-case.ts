import { Injectable, Inject, Logger } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import type { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { Paragraph } from '@/domain/chapters/value-objects/paragraph.vo';

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
    const chapter = await this.chapterRepository.findById(
      ChapterId.create(command.chapterId),
    );
    if (!chapter) {
      throw new NotFoundDomainException('Chapter not found');
    }

    const book = await this.bookRepository.findBySlug(command.bookSlug);
    if (!book) {
      throw new NotFoundDomainException('Book not found');
    }

    const questionKeywords = this.extractKeywords(command.question);
    const paragraphs = chapter.paragraphs;
    const totalContent = paragraphs.map((p) => p.content).join('\n');

    let selectedContent: string;
    if (totalContent.length <= 5000) {
      selectedContent = totalContent;
    } else {
      selectedContent = this.selectRelevantContent(
        paragraphs,
        questionKeywords,
      );
    }

    const prompt = `
      Bạn là một trợ lý đọc sách thông minh.
      Nhiệm vụ của bạn là giải đáp thắc mắc của độc giả về chương sách hiện tại.

      Tác phẩm: "${String(book.title)}"
      Chương: "${String(chapter.title)}"

      Nội dung chương:
      ${selectedContent}

      Câu hỏi của độc giả: "${command.question}"

      Hãy trả lời một cách thông minh, sâu sắc, đúng trọng tâm nội dung chương sách.
      Ngôn ngữ: Tiếng Việt. Độ dài: Ngắn gọn (2-4 câu).
    `;

    const aiResponse = await this.geminiService.generateText(prompt);

    return {
      answer:
        aiResponse ||
        'Xin lỗi, tôi không thể tìm thấy câu trả lời phù hợp trong chương này.',
      createdAt: new Date(),
    };
  }

  private extractKeywords(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[.,!?;:'"()[\]{}<>/\\@#$%^&*\-_=+~`|]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

    return new Set(words);
  }

  private selectRelevantContent(
    paragraphs: Paragraph[],
    keywords: Set<string>,
  ): string {
    const MAX_CHARS = 5000;

    const scored = paragraphs.map((p, index) => {
      const content = p.content;
      let totalMatches = 0;

      for (const keyword of keywords) {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'gi');
        const matches = content.match(regex);
        if (matches) {
          totalMatches += matches.length;
        }
      }

      const totalWords = content.split(/\s+/).length;
      const score = totalWords > 0 ? totalMatches / totalWords : 0;

      return { index, content, score, paragraph: p };
    });

    scored.sort((a, b) => b.score - a.score);

    const selected: typeof scored = [];
    let currentLength = 0;

    for (const item of scored) {
      if (currentLength + item.content.length <= MAX_CHARS) {
        selected.push(item);
        currentLength += item.content.length;
      } else if (selected.length === 0) {
        selected.push(item);
        break;
      } else {
        break;
      }
    }

    selected.sort((a, b) => a.index - b.index);

    return selected.map((s) => s.content).join('\n');
  }
}
