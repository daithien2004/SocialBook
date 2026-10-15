import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

import { Comment } from '@/modules/comments/domain/entities/comment.entity';

export class UpdateCommentCommand extends Command<Comment> {
  constructor(
    public readonly id: string,
    public readonly actor: Actor,
    public readonly content: string,
  ) {
    super();
  }
}
