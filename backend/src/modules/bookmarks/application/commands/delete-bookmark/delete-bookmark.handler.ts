import { ForbiddenError } from '@casl/ability';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { BookmarkRepository } from '@/modules/bookmarks/domain/repositories/bookmark.repository';
import { DeleteBookmarkCommand } from './delete-bookmark.command';

@CommandHandler(DeleteBookmarkCommand)
export class DeleteBookmarkHandler implements ICommandHandler<DeleteBookmarkCommand> {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  @Transactional()
  async execute(command: DeleteBookmarkCommand): Promise<void> {
    const bookmark = await this.bookmarkRepository.findByParagraph(
      command.actor.userId,
      command.paragraphId,
    );
    if (!bookmark) {
      throw new NotFoundDomainException('Bookmark not found');
    }
    ForbiddenError.from(command.actor.ability).throwUnlessCan('delete', {
      __caslSubjectType__: 'Bookmark',
      id: bookmark.id,
      userId: bookmark.userId,
    });
    await this.bookmarkRepository.deleteByParagraph(
      command.actor.userId,
      command.paragraphId,
    );
  }
}
