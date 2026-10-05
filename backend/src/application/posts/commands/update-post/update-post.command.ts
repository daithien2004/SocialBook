import { Command } from '@nestjs/cqrs';
import { Post } from '@/domain/posts/entities/post.entity';
import { AppAbility } from '@socialbook/shared';

export class UpdatePostCommand extends Command<{
  post: Post;
  moderationMessage?: string;
}> {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
    public readonly ability: AppAbility,
    public readonly content?: string,
    public readonly bookId?: string,
    public readonly imageUrls?: string[],
    public readonly files?: Express.Multer.File[],
  ) {
    super();
  }
}
