import { GenerateBookAudioCommand } from './generate-book-audio.command';
import { CommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from '@/common/utils/error.util';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import {
  GenerateChapterAudioHandler,
  GenerateAudioOptions,
} from '@/application/text-to-speech/commands/generate-chapter-audio/generate-chapter-audio.handler';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';

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
    private readonly generateChapterAudioUseCase: GenerateChapterAudioHandler,
    private readonly chapterRepository: IChapterRepository,
  ) {}

  async execute(
    bookIdStr: string,
    options: GenerateAudioOptions = {},
  ): Promise<GenerateBookResult> {
    const bookId = BookId.create(bookIdStr);

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
        const result = await this.generateChapterAudioUseCase.execute(
          chapterId,
          options,
        );
        results.successful++;
        results.generated.push({
          chapterId: chapterId,
          status: 'success',
          audioUrl: result.audioUrl!,
        });
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
