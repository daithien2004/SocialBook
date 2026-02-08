import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { Chapter } from '@/domain/chapters/entities/chapter.entity';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import { ChapterTitle } from '@/domain/chapters/value-objects/chapter-title.vo';
import { BookId } from '@/domain/chapters/value-objects/book-id.vo';
import { UpdateChapterCommand } from './update-chapter.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class UpdateChapterUseCase {
    constructor(
        private readonly chapterRepository: IChapterRepository
    ) {}

    async execute(command: UpdateChapterCommand): Promise<Chapter> {
        const chapterId = ChapterId.create(command.id);
        
        const chapter = await this.chapterRepository.findById(chapterId);
        if (!chapter) {
            throw new NotFoundException(ErrorMessages.CHAPTER_NOT_FOUND);
        }

        // Check if title is being updated and if it conflicts with existing chapter
        if (command.title && command.title.trim() !== chapter.title.toString()) {
            const bookId = command.bookId ? BookId.create(command.bookId) : chapter.bookId;
            const newTitle = ChapterTitle.create(command.title);
            const exists = await this.chapterRepository.existsByTitle(newTitle, bookId, chapterId);
            
            if (exists) {
                throw new ConflictException('Chapter with this title already exists in this book');
            }
            
            chapter.changeTitle(command.title);
        }

        if (command.bookId !== undefined) {
            chapter.changeBook(command.bookId);
        }

        if (command.paragraphs !== undefined) {
            if (command.paragraphs.length === 0) {
                throw new Error('Chapter must have at least one paragraph');
            }
            
            // Clear existing paragraphs and add new ones
            const currentParagraphs = chapter.paragraphs;
            for (const currentParagraph of currentParagraphs) {
                try {
                    chapter.removeParagraph(currentParagraph.id);
                } catch (e) {
                    // Ignore if it's the last paragraph
                }
            }
            
            for (const paragraphData of command.paragraphs) {
                if (paragraphData.id) {
                    try {
                        chapter.updateParagraph(paragraphData.id, paragraphData.content);
                    } catch (e) {
                        chapter.addParagraph(paragraphData.content);
                    }
                } else {
                    chapter.addParagraph(paragraphData.content);
                }
            }
        }

        if (command.orderIndex !== undefined) {
            const bookId = command.bookId ? BookId.create(command.bookId) : chapter.bookId;
            const orderIndexExists = await this.chapterRepository.existsByOrderIndex(
                command.orderIndex, 
                bookId, 
                chapterId
            );
            
            if (orderIndexExists) {
                throw new ConflictException(`Chapter with order index ${command.orderIndex} already exists in this book`);
            }
            
            chapter.updateOrderIndex(command.orderIndex);
        }

        await this.chapterRepository.save(chapter);

        return chapter;
    }
}


