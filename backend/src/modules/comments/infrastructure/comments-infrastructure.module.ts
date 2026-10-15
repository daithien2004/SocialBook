import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { ICommentRepository } from '../domain/repositories/comment.repository.interface';
import { CommentRepository } from './repositories/comment.repository';
import { CommentReadRepository } from '../application/ports/comment-read.repository';
import { PrismaCommentReadRepository } from './repositories/prisma-comment-read.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    { provide: ICommentRepository, useClass: CommentRepository },
    { provide: CommentReadRepository, useClass: PrismaCommentReadRepository },
  ],
  exports: [ICommentRepository, CommentReadRepository],
})
export class CommentsInfrastructureModule {}
