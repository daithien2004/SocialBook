import type {
  ReadingRoomHighlightReadModel,
  ReadingRoomDetailsReadModel,
  ReadingRoomReadModel,
} from '@/modules/reading-rooms/application/read-models/reading-room.read-model';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { AppAbility } from '@/shared/casl/app-ability';

export abstract class ReadingRoomQueryRepository {
  abstract findHighlightById(
    roomId: string,
    highlightId: string,
    userId: string,
    ability: AppAbility,
  ): Promise<ReadingRoomHighlightReadModel | null>;

  abstract findHighlightPage(
    roomId: string,
    userId: string,
    pagination: PageParams,
    ability: AppAbility,
  ): Promise<PageResult<ReadingRoomHighlightReadModel> | null>;

  abstract findDetailsById(
    roomId: string,
    ability: AppAbility,
  ): Promise<ReadingRoomDetailsReadModel | null>;

  abstract findActiveSummariesByUser(
    userId: string,
    options: PageParams,
    ability: AppAbility,
  ): Promise<PageResult<ReadingRoomReadModel>>;

  abstract findHistorySummariesByUser(
    userId: string,
    options: PageParams,
    ability: AppAbility,
  ): Promise<PageResult<ReadingRoomReadModel>>;
}
