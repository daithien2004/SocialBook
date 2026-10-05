import { Command } from '@nestjs/cqrs';
import { ReadingStatus, ReadingList } from '@/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from "@/domain/library/read-models/library-item.read-model";
import { IReadingListRepository } from "@/domain/library/repositories/reading-list.repository.interface";
import { BookId } from "@/domain/library/value-objects/book-id.vo";
import { UserId } from "@/domain/library/value-objects/user-id.vo";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";
import { IRecommendationCachePort } from "@/domain/recommendations/interfaces/recommendation-cache.port";

export class UpdateStatusCommand extends Command<LibraryItemReadModel> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly status: ReadingStatus,
  ) { super(); }
}
