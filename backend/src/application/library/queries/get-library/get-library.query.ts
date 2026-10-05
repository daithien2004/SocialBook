import { Query } from '@nestjs/cqrs';
import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from "@/domain/library/read-models/library-item.read-model";
import { IReadingListRepository } from "@/domain/library/repositories/reading-list.repository.interface";
import { IReadingProgressRepository } from "@/domain/library/repositories/reading-progress.repository.interface";
import { BookId } from "@/domain/library/value-objects/book-id.vo";
import { UserId } from "@/domain/library/value-objects/user-id.vo";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";

export class GetLibraryQuery extends Query<LibraryItemReadModel[]> {
  constructor(
    public readonly userId: string,
    public readonly status?: ReadingStatus | ReadingStatus[],
    public readonly limit?: number,
  ) { super(); }
}
