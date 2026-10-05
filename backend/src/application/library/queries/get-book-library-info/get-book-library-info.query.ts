import { Query } from '@nestjs/cqrs';
import { ICollectionRepository } from "@/domain/library/repositories/collection.repository.interface";
import { IReadingListRepository } from "@/domain/library/repositories/reading-list.repository.interface";
import { BookId } from "@/domain/library/value-objects/book-id.vo";
import { UserId } from "@/domain/library/value-objects/user-id.vo";
import { IReadingProgressRepository } from "@/domain/library/repositories/reading-progress.repository.interface";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { ChapterStatus } from "@/domain/library/entities/reading-progress.entity";

import { GetBookLibraryInfoResult } from '@/application/library/queries/get-book-library-info/get-book-library-info.handler';

export class GetBookLibraryInfoQuery extends Query<GetBookLibraryInfoResult> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
  ) { super(); }
}
