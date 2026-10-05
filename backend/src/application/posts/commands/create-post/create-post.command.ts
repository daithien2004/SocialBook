import { Command } from '@nestjs/cqrs';
import { Post } from '@/domain/posts/entities/post.entity';

export class CreatePostCommand extends Command<{
  post: Post;
  moderationMessage?: string;
}> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly content: string,
    public readonly files?: Express.Multer.File[],
  ) {
    super();
  }
}
