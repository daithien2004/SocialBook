import { Module } from '@nestjs/common';
import { CommentsApplicationModule } from './application/comments-application.module';
import { CommentsController } from './presentation/comments.controller';

@Module({
  imports: [CommentsApplicationModule],
  controllers: [CommentsController],
})
export class CommentsModule {}
