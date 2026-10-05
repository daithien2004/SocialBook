import { Comment } from '@/domain/comments/entities/comment.entity';
import { Command } from '@nestjs/cqrs';
export class CreateCommentCommand extends Command<Comment> {
  constructor(
    public readonly userId: string,
    public readonly targetType:
      'book' | 'chapter' | 'post' | 'author' | 'paragraph',
    public readonly targetId: string,
    public readonly content: string,
    public readonly parentId?: string | null,
  ) {
    super();
  }
}
