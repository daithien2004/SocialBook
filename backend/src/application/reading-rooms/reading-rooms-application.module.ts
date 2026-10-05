import { Module } from '@nestjs/common';
import { CreateRoomHandler } from './commands/create-room/create-room.handler';
import { JoinRoomHandler } from './commands/join-room/join-room.handler';
import { LeaveRoomHandler } from './commands/leave-room/leave-room.handler';
import { ReactivateRoomHandler } from './commands/reactivate-room/reactivate-room.handler';
import { GetMyActiveRoomsHandler } from './queries/get-my-active-rooms/get-my-active-rooms.handler';
import { GetMyHistoryHandler } from './queries/get-my-history/get-my-history.handler';
import { GetRoomByCodeHandler } from './queries/get-room-by-code/get-room-by-code.handler';
import { ReadingRoomsRepositoryModule } from '@/infrastructure/database/repositories/reading-rooms/reading-rooms-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';

import { AddHighlightHandler } from './commands/add-highlight/add-highlight.handler';
import { GenerateHighlightInsightHandler } from './commands/generate-highlight-insight/generate-highlight-insight.handler';
import { RemoveHighlightHandler } from './commands/remove-highlight/remove-highlight.handler';
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
  RemoveHighlightHandler,
];

export const QueryHandlers = [
  GetMyActiveRoomsHandler,
  GetMyHistoryHandler,
  GetRoomByCodeHandler,
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
    },
  ],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class ReadingRoomsApplicationModule {}
