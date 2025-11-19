import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Like, LikeSchema } from '@/src/modules/likes/schemas/like.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Like.name, schema: LikeSchema }])],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
