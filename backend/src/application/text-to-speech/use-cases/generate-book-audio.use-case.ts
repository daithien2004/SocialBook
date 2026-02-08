import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { GenerateChapterAudioUseCase } from '@/application/text-to-speech/use-cases/generate-chapter-audio.use-case';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { Types } from 'mongoose';

@Injectable()
export class GenerateBookAudioUseCase {
    constructor(
        private readonly generateChapterAudioUseCase: GenerateChapterAudioUseCase,
        private readonly chapterRepository: IChapterRepository,
    ) {}

    async execute(bookId: string, options: any = {}): Promise<any> {
        if (!Types.ObjectId.isValid(bookId)) {
            throw new BadRequestException('Invalid book ID');
        }

        // Use findByBookSlug if needed or implement findByBookId in repo properly
        // For now, assume findByBook works or we use a workaround
        // The previous service implementation had complex fallback logic.
        // Let's rely on standard repository methods.
        const chapters = await this.chapterRepository.findByBook(bookId as any, { page: 1, limit: 1000 }); // Pagination handling might range large books

        if (!chapters.data || chapters.data.length === 0) {
            throw new NotFoundException('No chapters found for book');
        }

        const results = {
            total: chapters.data.length,
            successful: 0,
            failed: 0,
            generated: [] as Array<{ chapterId: string; status: string; audioUrl?: string }>,
            errors: [] as Array<{ chapterId: string; error: string }>
        };

        for (const chapter of chapters.data) {
            const chapterId = (chapter as any).id || (chapter as any)._id.toString();
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
