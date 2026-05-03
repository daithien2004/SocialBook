import { Module } from '@nestjs/common';
import { CreateRoomUseCase } from './use-cases/create-room/create-room.use-case';
import { JoinRoomUseCase } from './use-cases/join-room/join-room.use-case';
import { LeaveRoomUseCase } from './use-cases/leave-room/leave-room.use-case';
import { ChangeChapterUseCase } from './use-cases/change-chapter/change-chapter.use-case';
import { ChangeRoomModeUseCase } from './use-cases/change-room-mode/change-room-mode.use-case';
import { EndRoomUseCase } from './use-cases/end-room/end-room.use-case';
import { GetMyActiveRoomsUseCase } from './use-cases/get-my-active-rooms/get-my-active-rooms.use-case';
import { GetRoomByCodeUseCase } from './use-cases/get-room-by-code/get-room-by-code.use-case';
import { ReadingRoomsRepositoryModule } from '@/infrastructure/database/repositories/reading-rooms/reading-rooms-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';

import { AddHighlightUseCase } from './use-cases/add-highlight/add-highlight.use-case';
import { AskAIUseCase } from './use-cases/ask-ai/ask-ai.use-case';
import { GeminiApplicationModule } from '../gemini/gemini-application.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';

@Module({
  imports: [
    ReadingRoomsRepositoryModule,
    BooksRepositoryModule,
    ChaptersRepositoryModule,
    GeminiApplicationModule,
  ],
  providers: [
    CreateRoomUseCase,
    JoinRoomUseCase,
    LeaveRoomUseCase,
    ChangeChapterUseCase,
    ChangeRoomModeUseCase,
    EndRoomUseCase,
    AddHighlightUseCase,
    AskAIUseCase,
    GetMyActiveRoomsUseCase,
    GetRoomByCodeUseCase,
  ],
  exports: [
    CreateRoomUseCase,
    JoinRoomUseCase,
    LeaveRoomUseCase,
    ChangeChapterUseCase,
    ChangeRoomModeUseCase,
    EndRoomUseCase,
    AddHighlightUseCase,
    AskAIUseCase,
    GetMyActiveRoomsUseCase,
    GetRoomByCodeUseCase,
  ],
})
export class ReadingRoomsApplicationModule {}
