import { Module } from '@nestjs/common';
import { LikesApplicationModule } from './application/likes-application.module';
import { LikesController } from './presentation/likes.controller';

@Module({
  imports: [LikesApplicationModule],
  controllers: [LikesController],
})
export class LikesModule {}
