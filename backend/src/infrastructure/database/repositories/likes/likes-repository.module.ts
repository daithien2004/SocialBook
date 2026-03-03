import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Like, LikeSchema } from '@/infrastructure/database/schemas/like.schema';
import { ILikeRepository } from '@/domain/likes/repositories/like.repository.interface';
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
  exports: [
    ILikeRepository,
    MongooseModule,
  ],
})
export class LikesRepositoryModule {}
