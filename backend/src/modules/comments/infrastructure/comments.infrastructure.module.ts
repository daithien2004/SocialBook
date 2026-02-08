
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { CommentRepository } from './repositories/comment.repository';
import { ICommentRepository } from '../domain/repositories/comment.repository.interface';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    ],
    providers: [
        {
            provide: ICommentRepository,
            useClass: CommentRepository,
        },
    ],
    exports: [
        ICommentRepository,
        MongooseModule,
    ],
})
export class CommentsInfrastructureModule {}
