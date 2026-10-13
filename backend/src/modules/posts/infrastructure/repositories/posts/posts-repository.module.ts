import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { PostRepository } from './post.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IPostRepository,
      useClass: PostRepository,
    },
  ],
  exports: [IPostRepository],
})
export class PostsRepositoryModule {}
