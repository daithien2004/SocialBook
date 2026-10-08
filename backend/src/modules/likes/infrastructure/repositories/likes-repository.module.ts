import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Like,
  LikeSchema,
} from '@/modules/likes/infrastructure/schemas/like.schema';
import { ILikeRepository } from '@/modules/likes/domain/repositories/like.repository.interface';
import { LikeRepository } from './like.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Like.name, schema: LikeSchema }]),
  ],
  providers: [
    {
      provide: ILikeRepository,
      useClass: LikeRepository,
    },
  ],
  exports: [ILikeRepository],
})
export class LikesRepositoryModule {}
