import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { ICommentRepository } from '../domain/repositories/comment.repository.interface';
import { CommentRepository } from './repositories/comment.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [{ provide: ICommentRepository, useClass: CommentRepository }],
  exports: [ICommentRepository],
})
export class CommentsInfrastructureModule {}
