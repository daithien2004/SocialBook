import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IChapterRepository } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { ICachePort } from '@/shared/domain/cache.port';
import { RecordChapterViewCommand } from './record-chapter-view.command';
import { ForbiddenError } from '@casl/ability';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { ChapterErrorMessages } from '@/modules/chapters/application/error-messages';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';

const VIEW_DEDUP_TTL = 30 * 60; // 30 minutes

@CommandHandler(RecordChapterViewCommand)
export class RecordChapterViewHandler implements ICommandHandler<
  RecordChapterViewCommand,
  void
> {
  constructor(
    private readonly chapterRepository: IChapterRepository,
    private readonly cacheService: ICachePort,
    private readonly chapterReadRepository: IChapterReadRepository,
  ) {}

  async execute(command: RecordChapterViewCommand): Promise<void> {
    const canReadChapter = await this.chapterReadRepository.isAccessibleBySlug(
      command.actor.ability,
      command.chapterSlug,
      command.bookSlug,
    );
    if (!canReadChapter) {
      throw new NotFoundDomainException(ChapterErrorMessages.CHAPTER_NOT_FOUND);
    }
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'read',
      'Chapter',
    );

    const identity = command.userId ?? `ip:${command.clientIp ?? 'unknown'}`;
    const dedupKey = `chapter_view:${command.bookSlug}:${command.chapterSlug}:${identity}`;

    const isNew = await this.cacheService.setIfNotExists(
      dedupKey,
      '1',
      VIEW_DEDUP_TTL,
    );

    if (!isNew) return;

    await this.chapterRepository.incrementViewsBySlug(
      command.bookSlug,
      command.chapterSlug,
    );
  }
}
