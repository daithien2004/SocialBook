import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestDomainException,
  NotFoundDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IChapterRepository } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { ChapterId } from '@/modules/chapters/domain/chapters/value-objects/chapter-id.vo';
import { ChapterTitle } from '@/modules/chapters/domain/chapters/value-objects/chapter-title.vo';
import { BookId } from '@/modules/chapters/domain/chapters/value-objects/book-id.vo';
import { UpdateChapterCommand } from './update-chapter.command';
import { ChapterErrorMessages } from '@/modules/chapters/application/error-messages';
import { ChapterReadModel } from '@/modules/chapters/application/read-models/chapter.read-model';
import { ChapterApplicationMapper } from '../../mappers/chapter.mapper';
import { ReadingRoomReferencePort } from '@/modules/reading-rooms';
import { ForbiddenError, subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(UpdateChapterCommand)
export class UpdateChapterHandler implements ICommandHandler<
  UpdateChapterCommand,
  ChapterReadModel
> {
  constructor(
    private readonly chapterRepository: IChapterRepository,
    private readonly readingRoomReferences: ReadingRoomReferencePort,
  ) {}

  @Transactional()
  async execute(command: UpdateChapterCommand): Promise<ChapterReadModel> {
    const chapterId = ChapterId.create(command.id);

    const chapter = await this.chapterRepository.findById(chapterId);
    if (!chapter) {
      throw new NotFoundDomainException(ChapterErrorMessages.CHAPTER_NOT_FOUND);
    }
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('Chapter', {
        id: chapter.id.toString(),
        bookId: chapter.bookId.toString(),
        isDeleted: false,
      }),
    );

    // Check if title is being updated and if it conflicts with existing chapter
    if (command.title && command.title.trim() !== chapter.title.toString()) {
      const bookId = command.bookId
        ? BookId.create(command.bookId)
        : chapter.bookId;
      const newTitle = ChapterTitle.create(command.title);
      const exists = await this.chapterRepository.existsByTitle(
        newTitle,
        bookId,
        chapterId,
      );

      if (exists) {
        throw new ConflictDomainException(
          'Chapter with this title already exists in this book',
        );
      }

      chapter.changeTitle(command.title);
    }

    if (
      command.bookId !== undefined &&
      command.bookId !== chapter.bookId.toString() &&
      (await this.readingRoomReferences.hasActiveRoomForChapter(command.id))
    ) {
      throw new ConflictDomainException(
        'Không thể chuyển chương đang được phòng đọc sử dụng sang sách khác',
      );
    }

    if (command.bookId !== undefined) {
      chapter.changeBook(command.bookId);
    }

    if (command.paragraphs !== undefined) {
      if (command.paragraphs.length === 0) {
        throw new BadRequestDomainException(
          'Chapter must have at least one paragraph',
        );
      }

      const existingParagraphIds = new Set(
        chapter.paragraphs.map((paragraph) => paragraph.id),
      );
      chapter.replaceParagraphs(
        command.paragraphs.map((paragraph) => ({
          id:
            paragraph.id && existingParagraphIds.has(paragraph.id)
              ? paragraph.id
              : undefined,
          content: paragraph.content,
        })),
      );
    }

    if (command.orderIndex !== undefined) {
      const bookId = command.bookId
        ? BookId.create(command.bookId)
        : chapter.bookId;
      const orderIndexExists = await this.chapterRepository.existsByOrderIndex(
        command.orderIndex,
        bookId,
        chapterId,
      );

      if (orderIndexExists) {
        throw new ConflictDomainException(
          `Chapter with order index ${command.orderIndex} already exists in this book`,
        );
      }

      chapter.updateOrderIndex(command.orderIndex);
    }

    await this.chapterRepository.save(chapter);

    return ChapterApplicationMapper.toReadModel(chapter);
  }
}
