import { Inject, Injectable, Logger } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';
import { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import { SearchQuery } from '@/domain/chroma/entities/search-query.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { AskChatbotCommand } from './ask-chatbot.command';

export interface ChatbotSource {
  title: string;
  bookId?: string;
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
    @Inject(GEMINI_TOKENS.GEMINI_SERVICE)
    private readonly geminiService: IGeminiService,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: AskChatbotCommand): Promise<AskChatbotResult> {
    const { question } = command;

    const embedding = await this.vectorRepository.embedQuery(question);

    const searchQuery = SearchQuery.create({
      id: this.idGenerator.generate(),
      query: question,
      embedding,
      limit: 5,
      threshold: 0.3,
    });

    const results = await this.vectorRepository.search(searchQuery);

    this.logger.log(
      `Chatbot search: "${question}" → ${results.length} results`,
    );

    const sources: ChatbotSource[] = results.map((r) => {
      const metadata = r.document.metadata;
      return {
        title:
          typeof metadata?.['title'] === 'string'
            ? metadata['title']
            : 'Không rõ tiêu đề',
        bookId: metadata?.['bookId'] as string | undefined,
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

    const prompt =
      results.length > 0
        ? `Bạn là trợ lý đọc sách thông minh của SocialBook. Hãy trả lời câu hỏi dưới đây dựa trên ngữ cảnh từ các cuốn sách và chương được cung cấp.

Ngữ cảnh:
${contextText}

Câu hỏi: ${question}

Yêu cầu:
- Trả lời bằng tiếng Việt, ngắn gọn và chính xác
- Dựa trên ngữ cảnh được cung cấp
- Nếu ngữ cảnh không đủ thông tin, hãy nói rõ`
        : `Bạn là trợ lý đọc sách thông minh của SocialBook. Hãy trả lời câu hỏi sau bằng tiếng Việt một cách ngắn gọn và hữu ích:

Câu hỏi: ${question}`;

    const answer = await this.geminiService.generateText(prompt);

    return { question, answer, sources };
  }
}
