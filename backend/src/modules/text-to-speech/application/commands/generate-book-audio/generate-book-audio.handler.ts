import { GenerateBookAudioCommand } from './generate-book-audio.command';
import { CommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { GenerateChapterAudioCommand } from '@/modules/text-to-speech/application/commands/generate-chapter-audio/generate-chapter-audio.command';
import { ChapterAudioGenerationService } from '@/modules/text-to-speech/application/services/chapter-audio-generation.service';
import { IChapterRepository } from '@/modules/chapters/domain/public-api';
import { BookId } from '@/modules/books/domain/public-api';

export interface GenerateBookResult {
  total: number;
  successful: number;
  failed: number;
  generated: Array<{ chapterId: string; status: string; audioUrl?: string }>;
  errors: Array<{ chapterId: string; error: string }>;
}

@CommandHandler(GenerateBookAudioCommand)
export class GenerateBookAudioHandler {
  constructor(
    private readonly chapterAudioGeneration: ChapterAudioGenerationService,
    private readonly chapterRepository: IChapterRepository,
  ) {}

  async execute(
    command: GenerateBookAudioCommand,
  ): Promise<GenerateBookResult> {
    const bookId = BookId.create(command.bookId);

    const chapters = await this.chapterRepository.findByBook(bookId, {
      page: 1,
      limit: 1000,
    }); // Pagination handling might range large books

    if (!chapters.data || chapters.data.length === 0) {
      throw new NotFoundDomainException('No chapters found for book');
    }

    const results = {
      total: chapters.data.length,
      successful: 0,
      failed: 0,
      generated: [] as Array<{
        chapterId: string;
        status: string;
        audioUrl?: string;
      }>,
      errors: [] as Array<{ chapterId: string; error: string }>,
    };

    for (const chapter of chapters.data) {
      const chapterId = chapter.id.toString();
      try {
        const result = await this.chapterAudioGeneration.execute(
          new GenerateChapterAudioCommand(
            chapterId,
            command.forceRegenerate,
            command.voice,
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
