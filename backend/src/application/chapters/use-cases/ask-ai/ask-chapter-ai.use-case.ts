import { Injectable, Logger } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IAIPort } from '@/domain/ai/interfaces/ai.port';
import { getChapterContext } from '@/application/shared/utils/chapter-context-extractor';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import { AskChapterAICommand } from './ask-chapter-ai.command';

@Injectable()
export class AskChapterAIUseCase {
  private readonly logger = new Logger(AskChapterAIUseCase.name);

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly aiService: IAIPort,
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

    const selectedContent = getChapterContext(
      chapter.paragraphs,
      command.question,
    );

    const systemPrompt = `Bạn là trợ lý đọc sách thông minh của SocialBook.
CHỈ trả lời các câu hỏi liên quan đến sách, văn học, tác giả, nhân vật, tình tiết truyện.
Nếu câu hỏi không liên quan đến sách và văn học, hãy trả lời chính xác:
"Xin lỗi, mình chỉ hỗ trợ câu hỏi về sách và văn học."

Luôn trả lời bằng tiếng Việt.`;

    const prompt = `
      Nhiệm vụ: Giải đáp thắc mắc của độc giả về chương sách hiện tại.

      Tác phẩm: "${String(book.title)}"
      Chương: "${String(chapter.title)}"

      Nội dung dưới đây là các đoạn trích liên quan từ chương, không phải toàn bộ chương:
      ${selectedContent}

      Câu hỏi của độc giả: "${command.question}"

      Hãy trả lời một cách thông minh, sâu sắc, đúng trọng tâm nội dung chương sách.

      Quy tắc định dạng (BẮT BUỘC):
      - Chia câu trả lời thành 2-3 đoạn văn ngắn, mỗi đoạn 1-2 câu.
      - Ngăn cách các đoạn bằng một dòng trống (\\n\\n).
      - Dùng **từ quan trọng** để nhấn mạnh tên nhân vật, địa danh, khái niệm chính.
      - Không dùng markdown khác (không dùng #, -, *, danh sách).
    `;

    const aiResponse = await this.aiService.generateText(prompt, systemPrompt);

    return {
      answer:
        aiResponse ||
        'Xin lỗi, tôi không thể tìm thấy câu trả lời phù hợp trong chương này.',
      createdAt: new Date(),
    };
  }
}
