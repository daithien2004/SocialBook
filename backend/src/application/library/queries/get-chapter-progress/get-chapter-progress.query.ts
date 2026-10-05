import { Query } from '@nestjs/cqrs';
import { IReadingProgressRepository } from "@/domain/library/repositories/reading-progress.repository.interface";
import { UserId } from "@/domain/library/value-objects/user-id.vo";
import { ChapterId } from "@/domain/library/value-objects/chapter-id.vo";

import { ReadingProgressResult } from '@/application/library/dto/library.dto';

export class GetChapterProgressQuery extends Query<ReadingProgressResult | null> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
  ) { super(); }
}
