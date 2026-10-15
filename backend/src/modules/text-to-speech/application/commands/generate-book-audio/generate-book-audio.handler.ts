import { GenerateBookAudioCommand } from './generate-book-audio.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { GenerateChapterAudioCommand } from '@/modules/text-to-speech/application/commands/generate-chapter-audio/generate-chapter-audio.command';
import { ChapterAudioGenerationService } from '@/modules/text-to-speech/application/services/chapter-audio-generation.service';
import { QueryBus } from '@nestjs/cqrs';
import { GetBookAudioSourcesQuery } from '@/modules/chapters';
import { ForbiddenError } from '@casl/ability';
import type { GenerateBookAudioResult } from '../../text-to-speech.result';

@CommandHandler(GenerateBookAudioCommand)
export class GenerateBookAudioHandler implements ICommandHandler<GenerateBookAudioCommand> {
  constructor(
    private readonly chapterAudioGeneration: ChapterAudioGenerationService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    command: GenerateBookAudioCommand,
  ): Promise<GenerateBookAudioResult> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'TextToSpeech',
    );
    const chapters = await this.queryBus.execute(
      new GetBookAudioSourcesQuery(command.actor, command.bookId, 1000),
    );

    if (chapters.length === 0) {
      throw new NotFoundDomainException('No chapters found for book');
    }

    const generated: GenerateBookAudioResult['generated'] = [];
    const errors: GenerateBookAudioResult['errors'] = [];
    const results = {
      total: chapters.length,
      successful: 0,
      failed: 0,
      generated,
      errors,
    };

    for (const chapter of chapters) {
      const chapterId = chapter.id;
      try {
        const result = await this.chapterAudioGeneration.execute(
          new GenerateChapterAudioCommand(
            command.actor,
            chapterId,
            command.forceRegenerate,
            command.voice,
            command.speed,
            command.language,
            command.format,
          ),
        );
        results.successful++;
        const generated = {
          chapterId: chapterId,
          status: 'success',
          ...(result.audioUrl ? { audioUrl: result.audioUrl } : {}),
        };
        results.generated.push(generated);
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        results.failed++;
        results.errors.push({
          chapterId: chapterId,
          error: errorMessage,
        });
      }
    }

    return results;
  }
}
