import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { IChapterRepository } from '../../../domain/repositories/chapter.repository.interface';
import { Chapter } from '../../../domain/entities/chapter.entity';
import { ChapterTitle } from '../../../domain/value-objects/chapter-title.vo';
import { BookId } from '../../../domain/value-objects/book-id.vo';
import { CreateChapterCommand } from './create-chapter.command';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class CreateChapterUseCase {
    constructor(
        private readonly chapterRepository: IChapterRepository
    ) {}

    async execute(command: CreateChapterCommand): Promise<Chapter> {
        const title = ChapterTitle.create(command.title);
        const bookId = BookId.create(command.bookId);
        
        // Check if chapter with same title already exists in the same book
        const exists = await this.chapterRepository.existsByTitle(title, bookId);
        
        if (exists) {
            throw new ConflictException('Chapter with this title already exists in this book');
        }

        // Determine order index if not provided
        let orderIndex = command.orderIndex;
        if (orderIndex === undefined) {
            const maxOrderIndex = await this.chapterRepository.getMaxOrderIndex(bookId);
            orderIndex = maxOrderIndex + 1;
        }

        // Check if order index is already taken
        const orderIndexExists = await this.chapterRepository.existsByOrderIndex(orderIndex, bookId);
        if (orderIndexExists) {
            throw new ConflictException(`Chapter with order index ${orderIndex} already exists in this book`);
        }

        const chapter = Chapter.create({
            title: command.title,
            bookId: command.bookId,
            paragraphs: command.paragraphs,
            orderIndex: orderIndex
        });

        await this.chapterRepository.save(chapter);

        return chapter;
    }
}
