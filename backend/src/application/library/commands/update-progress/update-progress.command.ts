import { Command } from '@nestjs/cqrs';
import { ReadingList, ReadingStatus } from "@/domain/library/entities/reading-list.entity";
import { ReadingProgress, ChapterStatus } from "@/domain/library/entities/reading-progress.entity";
import { LibraryItemReadModel } from "@/domain/library/read-models/library-item.read-model";
import { IReadingListRepository } from "@/domain/library/repositories/reading-list.repository.interface";
import { IReadingProgressRepository } from "@/domain/library/repositories/reading-progress.repository.interface";
import { BookId } from "@/domain/library/value-objects/book-id.vo";
import { ChapterId } from "@/domain/library/value-objects/chapter-id.vo";
import { UserId } from "@/domain/library/value-objects/user-id.vo";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { IRecommendationCachePort } from "@/domain/recommendations/interfaces/recommendation-cache.port";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";

import { UpdateProgressResult } from '@/application/library/commands/update-progress/update-progress.handler';

export class UpdateProgressCommand extends Command<UpdateProgressResult> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly progress: number,
    public readonly monotonic: boolean = false,
  ) { super(); }
}
