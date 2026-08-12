import { Injectable } from '@nestjs/common';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { ICacheService } from '@/domain/shared/interfaces/cache.repository.interface';
import { RecordChapterViewQuery } from './record-chapter-view.query';

const VIEW_DEDUP_TTL = 30 * 60; // 30 phút

@Injectable()
export class RecordChapterViewUseCase {
  constructor(
    private readonly chapterRepository: IChapterRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(query: RecordChapterViewQuery): Promise<void> {
    const identity = query.userId ?? `ip:${query.clientIp}`;
    const dedupKey = `chapter_view:${query.bookSlug}:${query.chapterSlug}:${identity}`;

    const isNew = await this.cacheService.setIfNotExists(
      dedupKey,
      '1',
      VIEW_DEDUP_TTL,
    );

    if (!isNew) return;

    await this.chapterRepository.incrementViewsBySlug(
      query.bookSlug,
      query.chapterSlug,
    );
  }
}
