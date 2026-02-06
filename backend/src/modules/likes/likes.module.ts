import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';
import { DataAccessModule } from '@/src/data-access/data-access.module';

@Module({
  imports: [
    DataAccessModule,
    NotificationsModule,
  ],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule { }
