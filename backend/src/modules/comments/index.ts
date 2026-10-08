export {
  Comment as CommentSchemaModel,
  CommentSchema,
} from './infrastructure/schemas/comment.schema';
export type { CommentDocument } from './infrastructure/schemas/comment.schema';
export { ICommentRepository } from './domain/repositories/comment.repository.interface';
export { CommentId } from './domain/value-objects/comment-id.vo';
export { Comment as CommentEntity } from './domain/entities/comment.entity';
export { CommentsInfrastructureModule } from './infrastructure/comments-infrastructure.module';
export { CommentsApplicationModule } from './application/comments-application.module';
export { CommentsModule } from './comments.module';
