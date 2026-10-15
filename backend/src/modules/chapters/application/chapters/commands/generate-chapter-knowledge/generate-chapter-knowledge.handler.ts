import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import { GenerateChapterKnowledgeCommand } from './generate-chapter-knowledge.command';
import type { ChapterKnowledgeResult } from './generate-chapter-knowledge.result';
import { Logger } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';

import { IChapterKnowledgeRepository } from '@/modules/chapters/domain/chapters/repositories/chapter-knowledge.repository.interface';
import { IChapterRepository } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { IAIPort } from '@/modules/ai';
import {
  BookId as DomainBookId,
  IBookRepository,
} from '@/modules/books/domain/public-api';
import {
  ChapterKnowledge,
  KnowledgeEntityType,
} from '@/modules/chapters/domain/chapters/entities/chapter-knowledge.entity';
import { ChapterId } from '@/modules/chapters/domain/chapters/value-objects/chapter-id.vo';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { ChapterApplicationMapper } from '../../mappers/chapter.mapper';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(GenerateChapterKnowledgeCommand)
export class GenerateChapterKnowledgeHandler implements ICommandHandler<
  GenerateChapterKnowledgeCommand,
  ChapterKnowledgeResult
> {
  private readonly logger = new Logger(GenerateChapterKnowledgeHandler.name);

  constructor(
    private readonly knowledgeRepository: IChapterKnowledgeRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly bookRepository: IBookRepository,
    private readonly aiService: IAIPort,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    command: GenerateChapterKnowledgeCommand,
  ): Promise<ChapterKnowledgeResult> {
    const chapter = await this.chapterRepository.findById(
      ChapterId.create(command.chapterId),
    );
    if (!chapter) throw new NotFoundDomainException('Chapter not found');
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'read',
      subject('Chapter', {
        id: chapter.id.toString(),
        bookId: chapter.bookId.toString(),
        isDeleted: false,
      }),
    );
    const book = await this.bookRepository.findById(
      DomainBookId.create(chapter.bookId.toString()),
    );
    if (!book) throw new NotFoundDomainException('Book not found');
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'read',
      subject('Book', {
        id: book.id.toString(),
        status: book.status.toString(),
        isDeleted: false,
      }),
    );

    const existing = await this.knowledgeRepository.findByChapterId(
      command.chapterId,
    );
    if (!command.force && existing) {
      return ChapterApplicationMapper.toKnowledgeResult(existing);
    }

    // 3. Prepare prompt
    const content = chapter.paragraphs.map((p) => p.content).join('\n');
    const prompt = `
      Hãy phân tích nội dung chương sách sau đây và trích xuất các thực thể quan trọng theo định dạng JSON.
      Định dạng trả về:
      {
        "entities": [
          { "name": "Tên thực thể", "type": "character|location|concept|event|vocabulary|reference", "description": "Mô tả", "importance": 1-10 }
        ],
        "relationships": [
          { "source": "Tên thực thể A", "target": "Tên thực thể B", "type": "loại quan hệ (ví dụ: bạn bè, kẻ thù, sống tại...)", "description": "mô tả ngắn gọn" }
        ],
        "summary": "Tóm tắt ngắn gọn nội dung chương"
      }

      Lưu ý các loại thực thể:
      - character: Nhân vật xuất hiện.
      - location: Địa danh nhắc đến.
      - concept: Khái niệm, chủ đề trừu tượng.
      - event: Sự kiện lịch sử hoặc cốt truyện quan trọng.
      - vocabulary: Từ vựng khó, thành ngữ, từ Hán Việt hoặc từ chuyên môn cần giải nghĩa.
      - reference: Các điển tích, điển cố, hoặc các nhân vật/sự kiện bên ngoài được nhắc tới (metaphors).
      
      Yêu cầu:
      - Trả về tối đa 15 thực thể quan trọng nhất.
      - Trả về các mối quan hệ quan trọng giữa các thực thể vừa trích xuất được (ví dụ: 'A là chồng của B', 'A ghét B', 'Sự kiện X diễn ra tại địa điểm Y').
      - ĐẢM BẢO trích xuất được ít nhất 5-10 mối quan hệ nếu có thể.
      - importance: 1-10, với ý nghĩa:
        1-3: Xuất hiện thoáng qua, không ảnh hưởng cốt truyện
        4-6: Có vai trò nhất định, ảnh hưởng bối cảnh/tình tiết phụ
        7-9: Quan trọng, ảnh hưởng trực tiếp đến cốt truyện chính
        10:  Trọng tâm của chương, không thể bỏ qua
      - Ngôn ngữ: Tiếng Việt.

      Nội dung:
      ${content.substring(0, 20000)}
    `;

    this.logger.log(`Extracting knowledge for chapter ${command.chapterId}...`);
    interface KnowledgeEntity {
      name: string;
      type: KnowledgeEntityType;
      description: string;
      importance: number;
    }

    interface KnowledgeRelationship {
      source: string;
      target: string;
      type: string;
      description: string;
    }

    interface KnowledgeResult {
      entities: KnowledgeEntity[];
      relationships: KnowledgeRelationship[];
      summary: string;
    }

    const maxRetries = 2;
    let lastError: Error = new Error('Knowledge extraction failed');
    let result: KnowledgeResult | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await this.aiService.generateJSON<KnowledgeResult>(prompt);
        break;
      } catch (error: unknown) {
        lastError =
          error instanceof Error
            ? error
            : new Error('AI knowledge extraction failed');
        if (attempt < maxRetries) {
          this.logger.warn(
            `Knowledge extraction attempt ${String(attempt)} failed, retrying... ${lastError.message}`,
          );
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    if (!result) {
      throw lastError;
    }

    const knowledge = ChapterKnowledge.create({
      id: existing ? existing.id : this.idGenerator.generate(),
      chapterId: command.chapterId,
      entities: result.entities,
      relationships: result.relationships,
      summary: result.summary,
    });

    await this.saveKnowledge(knowledge);
    return ChapterApplicationMapper.toKnowledgeResult(knowledge);
  }

  @Transactional()
  private async saveKnowledge(knowledge: ChapterKnowledge): Promise<void> {
    await this.knowledgeRepository.save(knowledge);
  }
}
