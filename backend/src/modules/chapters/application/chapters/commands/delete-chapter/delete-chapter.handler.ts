import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  NotFoundDomainException,
  BadRequestDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IChapterRepository } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { ChapterId } from '@/modules/chapters/domain/chapters/value-objects/chapter-id.vo';
import { DeleteChapterCommand } from './delete-chapter.command';
import { ChapterErrorMessages } from '@/modules/chapters/application/error-messages';
import { ErrorMessages } from '@/shared/platform/constants/error-messages';
import { ReadingRoomReferencePort } from '@/modules/reading-rooms';
import { ForbiddenError, subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(DeleteChapterCommand)
export class DeleteChapterHandler implements ICommandHandler<
  DeleteChapterCommand,
  void
> {
  constructor(
    private readonly chapterRepository: IChapterRepository,
    private readonly readingRoomReferences: ReadingRoomReferencePort,
  ) {}

  @Transactional()
  async execute(command: DeleteChapterCommand): Promise<void> {
    if (!command.id) {
      throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
    }

    const chapterId = ChapterId.create(command.id);
    const chapter = await this.chapterRepository.findById(chapterId);
    if (!chapter) {
      throw new NotFoundDomainException(ChapterErrorMessages.CHAPTER_NOT_FOUND);
    }
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'delete',
      subject('Chapter', {
        id: chapter.id.toString(),
        bookId: chapter.bookId.toString(),
        isDeleted: false,
      }),
    );

    if (await this.readingRoomReferences.hasActiveRoomForChapter(command.id)) {
      throw new ConflictDomainException(
        'Không thể xóa chương đang được phòng đọc sử dụng',
      );
    }

    await this.chapterRepository.delete(chapterId, chapter.loadedVersion);
  }
}
