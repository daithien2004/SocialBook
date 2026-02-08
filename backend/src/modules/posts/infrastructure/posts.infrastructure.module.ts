
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/post.schema';
import { PostRepository } from './repositories/post.repository';
import { IPostRepository } from '../domain/repositories/post.repository.interface';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    ],
    providers: [
        {
            provide: IPostRepository,
            useClass: PostRepository,
        },
    ],
    exports: [
        IPostRepository,
    ],
})
export class PostsInfrastructureModule {}
