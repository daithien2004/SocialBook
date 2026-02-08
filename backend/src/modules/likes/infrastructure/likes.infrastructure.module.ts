
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Like, LikeSchema } from './schemas/like.schema';
import { LikeRepository } from './repositories/like.repository';
import { ILikeRepository } from '../domain/repositories/like.repository.interface';

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
    ],
})
export class LikesInfrastructureModule {}
