import { Comment } from '@/modules/comments/domain/entities/comment.entity';
import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
export class CreateCommentCommand extends Command<Comment> {
  constructor(
    public readonly actor: Actor,
    public readonly targetType:
      'book' | 'chapter' | 'post' | 'author' | 'paragraph',
    public readonly targetId: string,
    public readonly content: string,
    public readonly parentId?: string | null,
  ) {
    super();
  }
}
