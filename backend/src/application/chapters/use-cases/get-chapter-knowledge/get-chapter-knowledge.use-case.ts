import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';

import { IChapterKnowledgeRepository } from '@/domain/chapters/repositories/chapter-knowledge.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import type { IGeminiService } from '@/domain/gemini/services/gemini.service.interface';
import { ChapterKnowledge } from '@/domain/chapters/entities/chapter-knowledge.entity';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

import { GetChapterKnowledgeQuery } from './get-chapter-knowledge.query';

@Injectable()
export class GetChapterKnowledgeUseCase {
  private readonly logger = new Logger(GetChapterKnowledgeUseCase.name);

  constructor(
    private readonly knowledgeRepository: IChapterKnowledgeRepository,
    private readonly chapterRepository: IChapterRepository,
    @Inject(GEMINI_TOKENS.GEMINI_SERVICE)
    private readonly geminiService: IGeminiService,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(query: GetChapterKnowledgeQuery) {

    const existing = await this.knowledgeRepository.findByChapterId(query.chapterId);
    if (!query.force && existing) {
      return existing;
    }

    // 2. Fetch chapter
    const chapter = await this.chapterRepository.findById(ChapterId.create(query.chapterId));
    if (!chapter) throw new NotFoundException('Chapter not found');

    // 3. Prepare prompt
    const content = chapter.paragraphs.map(p => p.content).join('\n');
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
      - Ngôn ngữ: Tiếng Việt.

      Nội dung:
      ${content.substring(0, 5000)}
    `;

    this.logger.log(`Extracting knowledge for chapter ${query.chapterId}...`);
    const result = await this.geminiService.generateJSON<{
      entities: any[];
      relationships: any[];
      summary: string;
    }>(prompt);

    const knowledge = ChapterKnowledge.create({
      id: existing ? existing.id : this.idGenerator.generate(),
      chapterId: query.chapterId,
      entities: result.entities,
      relationships: result.relationships,
      summary: result.summary,
    });




    await this.knowledgeRepository.save(knowledge);
    return knowledge;
  }
}

