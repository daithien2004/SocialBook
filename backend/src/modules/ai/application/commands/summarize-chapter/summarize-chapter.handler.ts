import { SummarizeChapterCommand } from './summarize-chapter.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IAIPort } from '@/modules/ai/domain/interfaces/ai.port';
import { IAIRequestRepository } from '@/modules/ai/domain/repositories/ai-request.repository.interface';
import { IChapterRepository } from '@/modules/chapters/domain/public-api';
import { ChapterId } from '@/modules/chapters/domain/public-api';
import {
  AIRequest,
  AIRequestType,
} from '@/modules/ai/domain/entities/ai-request.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import type { SummarizeChapterResult } from '@/modules/ai/application/ai.result';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(SummarizeChapterCommand)
export class SummarizeChapterHandler implements ICommandHandler<SummarizeChapterCommand> {
  constructor(
    private readonly aiService: IAIPort,
    private readonly aiRequestRepository: IAIRequestRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    command: SummarizeChapterCommand,
  ): Promise<SummarizeChapterResult> {
    if (!command.actor.ability.can('create', 'AIRequest')) {
      throw new ForbiddenDomainException('AI_REQUEST_CREATE_FORBIDDEN');
    }

    const chapter = await this.chapterRepository.findById(
      ChapterId.create(command.chapterId),
    );
    if (!chapter) {
      throw new NotFoundDomainException('Chapter not found');
    }

    const requestId = this.idGenerator.generate();
    const aiRequest =
      command.actor.userId === 'anonymous'
        ? null
        : AIRequest.create({
            id: requestId,
            prompt: `Summarize chapter "${String(chapter.title)}" (ID: ${command.chapterId})`,
            type: AIRequestType.CHAPTER_SUMMARY,
            userId: command.actor.userId,
            metadata: { chapterId: command.chapterId },
          });

    try {
      const content = chapter.paragraphs.map((p) => p.content).join('\n');
      const summary = await this.aiService.summarizeChapter(
        content,
        String(chapter.title),
      );

      if (aiRequest) {
        aiRequest.setResponse(summary);
        await this.saveRequest(aiRequest);
      }

      return {
        summary,
        requestId,
        chapterId: command.chapterId,
        summaryLength: summary.length,
      };
    } catch (error) {
      if (aiRequest) await this.saveRequest(aiRequest);
      throw error;
    }
  }

  @Transactional()
  private async saveRequest(request: AIRequest): Promise<void> {
    await this.aiRequestRepository.save(request);
  }
}
