import { Module } from '@nestjs/common';
import { CreateRoomUseCase } from './use-cases/create-room/create-room.use-case';
import { JoinRoomUseCase } from './use-cases/join-room/join-room.use-case';
import { LeaveRoomUseCase } from './use-cases/leave-room/leave-room.use-case';
import { ChangeChapterUseCase } from './use-cases/change-chapter/change-chapter.use-case';
import { ChangeRoomModeUseCase } from './use-cases/change-room-mode/change-room-mode.use-case';
import { EndRoomUseCase } from './use-cases/end-room/end-room.use-case';
import { ReactivateRoomUseCase } from './use-cases/reactivate-room/reactivate-room.use-case';
import { DeleteRoomUseCase } from './use-cases/delete-room/delete-room.use-case';
import { GetMyActiveRoomsUseCase } from './use-cases/get-my-active-rooms/get-my-active-rooms.use-case';
import { GetMyHistoryUseCase } from './use-cases/get-my-history/get-my-history.use-case';
import { GetRoomByCodeUseCase } from './use-cases/get-room-by-code/get-room-by-code.use-case';
import { ReadingRoomsRepositoryModule } from '@/infrastructure/database/repositories/reading-rooms/reading-rooms-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';

import { AddHighlightUseCase } from './use-cases/add-highlight/add-highlight.use-case';
import { GenerateHighlightInsightUseCase } from './use-cases/generate-highlight-insight/generate-highlight-insight.use-case';
import { RemoveHighlightUseCase } from './use-cases/remove-highlight/remove-highlight.use-case';
import { GeminiApplicationModule } from '../gemini/gemini-application.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { ReadingRoomInteractionsRepositoryModule } from '@/infrastructure/database/repositories/reading-room-interactions/reading-room-interactions-repository.module';
import { ReadingRoomPresenceModule } from '@/infrastructure/gateways/reading-room-presence.module';

@Module({
  imports: [
    ReadingRoomsRepositoryModule,
    BooksRepositoryModule,
    ChaptersRepositoryModule,
    GeminiApplicationModule,
    ReadingRoomInteractionsRepositoryModule,
    ReadingRoomPresenceModule,
  ],
  providers: [
    CreateRoomUseCase,
    JoinRoomUseCase,
    LeaveRoomUseCase,
    ChangeChapterUseCase,
    ChangeRoomModeUseCase,
    EndRoomUseCase,
    ReactivateRoomUseCase,
    DeleteRoomUseCase,
    AddHighlightUseCase,
    RemoveHighlightUseCase,
    GenerateHighlightInsightUseCase,
    GetMyActiveRoomsUseCase,
    GetMyHistoryUseCase,
    GetRoomByCodeUseCase,
  ],
  exports: [
    CreateRoomUseCase,
    JoinRoomUseCase,
    LeaveRoomUseCase,
    ChangeChapterUseCase,
    ChangeRoomModeUseCase,
    EndRoomUseCase,
    ReactivateRoomUseCase,
    DeleteRoomUseCase,
    AddHighlightUseCase,
    RemoveHighlightUseCase,
    GenerateHighlightInsightUseCase,
    GetMyActiveRoomsUseCase,
    GetMyHistoryUseCase,
    GetRoomByCodeUseCase,
  ],
})
export class ReadingRoomsApplicationModule {}
