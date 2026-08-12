import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IAIPort } from '@/domain/ai/interfaces/ai.port';
import { IAIRequestRepository } from '@/domain/ai/repositories/ai-request.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import {
  AIRequest,
  AIRequestType,
} from '@/domain/ai/entities/ai-request.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

export interface SummarizeChapterRequest {
  chapterId: string;
  userId: string;
}

export interface SummarizeChapterResponse {
  summary: string;
  requestId: string;
  chapterId: string;
  summaryLength: number;
}

@Injectable()
export class SummarizeChapterUseCase {
  constructor(
    private readonly aiService: IAIPort,
    private readonly aiRequestRepository: IAIRequestRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: SummarizeChapterRequest,
  ): Promise<SummarizeChapterResponse> {
    const chapter = await this.chapterRepository.findById(
      ChapterId.create(request.chapterId),
    );
    if (!chapter) {
      throw new NotFoundDomainException('Chapter not found');
    }

    const aiRequest = AIRequest.create({
      id: this.idGenerator.generate(),
      prompt: `Summarize chapter "${String(chapter.title)}" (ID: ${request.chapterId})`,
      type: AIRequestType.CHAPTER_SUMMARY,
      userId: request.userId,
      metadata: { chapterId: request.chapterId },
    });

    try {
      const content = chapter.paragraphs.map((p) => p.content).join('\n');
      const summary = await this.aiService.summarizeChapter(
        content,
        String(chapter.title),
      );

      aiRequest.setResponse(summary);
      await this.aiRequestRepository.save(aiRequest);

      return {
        summary,
        requestId: aiRequest.id.toString(),
        chapterId: request.chapterId,
        summaryLength: aiRequest.getResponseLength(),
      };
    } catch (error) {
      await this.aiRequestRepository.save(aiRequest);
      throw error;
    }
  }
}
