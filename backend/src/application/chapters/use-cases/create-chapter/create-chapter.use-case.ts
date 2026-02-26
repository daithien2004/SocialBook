import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Chapter } from '@/domain/chapters/entities/chapter.entity';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import { ChapterTitle } from '@/domain/chapters/value-objects/chapter-title.vo';
import { BookId } from '@/domain/chapters/value-objects/book-id.vo';
import { CreateChapterCommand } from './create-chapter.command';
import { ChapterResult } from '../get-chapters/get-chapters.result';
import { ChapterApplicationMapper } from '../../mappers/chapter.mapper';

@Injectable()
export class CreateChapterUseCase {
    constructor(
        private readonly chapterRepository: IChapterRepository,
        private readonly idGenerator: IIdGenerator
    ) {}

    async execute(command: CreateChapterCommand): Promise<ChapterResult> {
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
            id: ChapterId.create(this.idGenerator.generate()),
            title: command.title,
            bookId: command.bookId,
            paragraphs: command.paragraphs,
            orderIndex: orderIndex
        });


        await this.chapterRepository.save(chapter);

        return ChapterApplicationMapper.toResult(chapter);
    }
}


