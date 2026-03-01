import { Module } from '@nestjs/common';
import { CreateCommentUseCase } from './use-cases/create-comment/create-comment.use-case';
import { DeleteCommentUseCase } from './use-cases/delete-comment/delete-comment.use-case';
import { GetCommentsUseCase } from './use-cases/get-comments/get-comments.use-case';
import { GetCommentCountUseCase } from './use-cases/get-comment-count/get-comment-count.use-case';
import { ModerateCommentUseCase } from './use-cases/moderate-comment/moderate-comment.use-case';
import { UpdateCommentUseCase } from './use-cases/update-comment/update-comment.use-case';
import { CommentsRepositoryModule } from '@/infrastructure/database/repositories/comments/comments-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    CommentsRepositoryModule,
    IdGeneratorModule,
  ],
  providers: [
    CreateCommentUseCase,
    DeleteCommentUseCase,
    GetCommentsUseCase,
    GetCommentCountUseCase,
    ModerateCommentUseCase,
    UpdateCommentUseCase,
  ],
  exports: [
    CreateCommentUseCase,
    DeleteCommentUseCase,
    GetCommentsUseCase,
    GetCommentCountUseCase,
    ModerateCommentUseCase,
    UpdateCommentUseCase,
  ],
})
export class CommentsApplicationModule { }
