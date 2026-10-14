import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/repositories/chapters/chapters-repository.module';
import { TouchChapterForReadingRoomHandler } from '../chapters/commands/touch-chapter-for-reading-room/touch-chapter-for-reading-room.handler';
import { GetReadingRoomChapterHandler } from '../chapters/queries/get-reading-room-chapter/get-reading-room-chapter.handler';
import { GetReadingRoomChapterContextHandler } from '../chapters/queries/get-reading-room-chapter-context/get-reading-room-chapter-context.handler';

@Module({
  imports: [ChaptersRepositoryModule, CqrsModule],
  providers: [
    TouchChapterForReadingRoomHandler,
    GetReadingRoomChapterHandler,
    GetReadingRoomChapterContextHandler,
  ],
})
export class ChaptersReadingRoomsIntegrationModule {}
