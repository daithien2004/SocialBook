import { Injectable, Logger } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';
import { IAIPort } from '@/domain/ai/interfaces/ai.port';
import { SearchQuery } from '@/domain/chroma/entities/search-query.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { AskChatbotCommand } from './ask-chatbot.command';

export interface ChatbotSource {
  title: string;
  bookId?: string;
  bookSlug?: string;
  chapterTitle?: string;
  type: 'book' | 'chapter';
}

export interface AskChatbotResult {
  question: string;
  answer: string;
  sources: ChatbotSource[];
}

@Injectable()
export class AskChatbotUseCase {
  private readonly logger = new Logger(AskChatbotUseCase.name);

  constructor(
    private readonly vectorRepository: IVectorRepository,
    private readonly aiService: IAIPort,
    private readonly idGenerator: IIdGenerator,
    private readonly bookRepository: IBookRepository,
  ) {}

  async execute(command: AskChatbotCommand): Promise<AskChatbotResult> {
    const { question } = command;

    const embedding = await this.vectorRepository.embedQuery(question);

    const searchQuery = SearchQuery.create({
      id: this.idGenerator.generate(),
      query: question,
      embedding,
      limit: 5,
      threshold: 0.5,
    });

    const results = await this.vectorRepository.search(searchQuery);

    this.logger.log(
      `Chatbot search: "${question}" → results: ${JSON.stringify(results, null, 2)}`,
    );

    if (results.length === 0) {
      return {
        question,
        answer:
          'Xin lỗi, tôi không có đủ thông tin để trả lời câu hỏi này. Bạn hãy thử hỏi về một cuốn sách cụ thể trong thư viện nhé!',
        sources: [],
      };
    }

    // Collect unique bookIds to resolve slugs in one batch
    const bookIds = [
      ...new Set(
        results
          .map((r) => r.document.metadata?.['bookId'] as string | undefined)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const slugMap = new Map<string, string>();
    await Promise.all(
      bookIds.map(async (id) => {
        const book = await this.bookRepository
          .findById(BookId.create(id))
          .catch(() => null);
        if (book) slugMap.set(id, book.slug);
      }),
    );

    const sources: ChatbotSource[] = results.map((r) => {
      const metadata = r.document.metadata;
      const bookId = metadata?.['bookId'] as string | undefined;
      return {
        title:
          typeof metadata?.['title'] === 'string'
            ? metadata['title']
            : 'Không rõ tiêu đề',
        bookId,
        bookSlug: bookId ? slugMap.get(bookId) : undefined,
        chapterTitle: metadata?.['chapterTitle'] as string | undefined,
        type:
          r.document.contentType?.toString() === 'chapter' ? 'chapter' : 'book',
      };
    });

    const contextText = results
      .map((r, i) => {
        const title =
          typeof r.document.metadata?.['title'] === 'string'
            ? r.document.metadata['title']
            : '';
        const chapterTitle =
          typeof r.document.metadata?.['chapterTitle'] === 'string'
            ? r.document.metadata['chapterTitle']
            : '';
        const label = chapterTitle ? `${title} - ${chapterTitle}` : title;
        return `[${i + 1}] ${label}:\n${r.document.content}`;
      })
      .join('\n\n');

    const systemPrompt = `Bạn là trợ lý đọc sách thông minh của SocialBook.
CHỈ trả lời các câu hỏi liên quan đến sách, văn học, tác giả, nhân vật, tình tiết truyện, review sách.
Nếu câu hỏi không liên quan đến sách và văn học, hãy trả lời chính xác:
"Xin lỗi, mình chỉ hỗ trợ câu hỏi về sách và văn học."

Luôn trả lời bằng tiếng Việt, ngắn gọn và chính xác.`;

    const prompt = `Dựa trên ngữ cảnh từ các cuốn sách và chương được cung cấp bên dưới, hãy trả lời câu hỏi của người dùng.

Ngữ cảnh:
${contextText}

Câu hỏi: ${question}

Yêu cầu:
- Trả lời dựa trên ngữ cảnh được cung cấp
- Nếu ngữ cảnh không đủ thông tin, hãy nói rõ`;

    const answer = await this.aiService.generateText(prompt, systemPrompt);

    return { question, answer, sources };
  }
}
