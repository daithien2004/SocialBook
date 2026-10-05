import { Command } from '@nestjs/cqrs';
import { AppAbility } from '@socialbook/shared';

import { Comment } from '@/domain/comments/entities/comment.entity';

export class UpdateCommentCommand extends Command<Comment> {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
    public readonly content: string,
  ) {
    super();
  }
}
