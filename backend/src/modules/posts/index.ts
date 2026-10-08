export { PostsModule } from './posts.module';
export { PostsApplicationModule } from './application/posts/posts-application.module';
export { PostModerationApplicationModule } from './application/posts/post-moderation.application.module';
export { PostsRepositoryModule } from './infrastructure/repositories/posts/posts-repository.module';
export { Post } from './domain/posts/entities/post.entity';
export { IPostRepository } from './domain/posts/repositories/post.repository.interface';
export { ModerationStatus } from './domain/posts/enums/moderation-status.enum';
export {
  Post as PostSchemaModel,
  PostSchema,
} from './infrastructure/schemas/post.schema';
export type { PostDocument } from './infrastructure/schemas/post.schema';
