import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { GenerateChapterAudioUseCase } from '@/application/text-to-speech/use-cases/generate-chapter-audio.use-case';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';

@Injectable()
export class GenerateBookAudioUseCase {
    constructor(
        private readonly generateChapterAudioUseCase: GenerateChapterAudioUseCase,
        private readonly chapterRepository: IChapterRepository,
    ) { }

    async execute(bookIdStr: string, options: any = {}): Promise<any> {
        const bookId = BookId.create(bookIdStr);

        const chapters = await this.chapterRepository.findByBook(bookId, { page: 1, limit: 1000 }); // Pagination handling might range large books

        if (!chapters.data || chapters.data.length === 0) {
            throw new NotFoundDomainException('No chapters found for book');
        }

        const results = {
            total: chapters.data.length,
            successful: 0,
            failed: 0,
            generated: [] as Array<{ chapterId: string; status: string; audioUrl?: string }>,
            errors: [] as Array<{ chapterId: string; error: string }>
        };

        for (const chapter of chapters.data) {
            const chapterId = chapter.id.toString();
            try {
                const result = await this.generateChapterAudioUseCase.execute(chapterId, options);
                results.successful++;
                results.generated.push({
                    chapterId: chapterId,
                    status: 'success',
                    audioUrl: result.audioUrl
                });
            } catch (error) {
                results.failed++;
                results.errors.push({
                    chapterId: chapterId,
                    error: error.message
                });
            }
        }

        return results;
    }
}
