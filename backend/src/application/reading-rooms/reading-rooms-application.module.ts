import { Module } from '@nestjs/common';
import { CreateRoomHandler } from './use-cases/create-room/create-room.handler';
import { JoinRoomHandler } from './use-cases/join-room/join-room.handler';
import { LeaveRoomHandler } from './use-cases/leave-room/leave-room.handler';
import { ReactivateRoomHandler } from './use-cases/reactivate-room/reactivate-room.handler';
import { GetMyActiveRoomsHandler } from './use-cases/get-my-active-rooms/get-my-active-rooms.handler';
import { GetMyHistoryHandler } from './use-cases/get-my-history/get-my-history.handler';
import { GetRoomByCodeHandler } from './use-cases/get-room-by-code/get-room-by-code.handler';
import { ReadingRoomsRepositoryModule } from '@/infrastructure/database/repositories/reading-rooms/reading-rooms-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';

import { AddHighlightHandler } from './use-cases/add-highlight/add-highlight.handler';
import { GenerateHighlightInsightHandler } from './use-cases/generate-highlight-insight/generate-highlight-insight.handler';
import { RemoveHighlightHandler } from './use-cases/remove-highlight/remove-highlight.handler';
import { AIApplicationModule } from '../ai/ai-application.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';

import { IPresencePort } from '@/domain/reading-rooms/interfaces/presence.port';
import { ReadingRoomPresenceService } from './presence/reading-room-presence.service';

export const CommandHandlers = [
  CreateRoomHandler,
  JoinRoomHandler,
  LeaveRoomHandler,
  ReactivateRoomHandler,
  AddHighlightHandler,
  GenerateHighlightInsightHandler,
  RemoveHighlightHandler
];

export const QueryHandlers = [
  GetMyActiveRoomsHandler,
  GetMyHistoryHandler,
  GetRoomByCodeHandler
];


@Module({
  imports: [
    ReadingRoomsRepositoryModule,
    BooksRepositoryModule,
    ChaptersRepositoryModule,
    AIApplicationModule,
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ReadingRoomPresenceService,
    {
      provide: IPresencePort,
      useExisting: ReadingRoomPresenceService,
    }
  ],
  exports: [
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class ReadingRoomsApplicationModule {}
