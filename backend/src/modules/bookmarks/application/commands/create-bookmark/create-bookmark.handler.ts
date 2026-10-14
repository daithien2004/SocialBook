import { ForbiddenError } from '@casl/ability';
import { CommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { BookmarkRepository } from '@/modules/bookmarks/domain/repositories/bookmark.repository';
import { Bookmark } from '@/modules/bookmarks/domain/entities/bookmark.entity';
import { CreateBookmarkCommand } from './create-bookmark.command';

@CommandHandler(CreateBookmarkCommand)
export class CreateBookmarkHandler {
  constructor(
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  @Transactional()
  async execute(command: CreateBookmarkCommand): Promise<string> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'Bookmark',
    );
    const bookmark = Bookmark.create(this.idGenerator.generate(), {
      ...command.input,
      userId: command.actor.userId,
    });
    await this.bookmarkRepository.save(bookmark);
    return bookmark.id;
  }
}
