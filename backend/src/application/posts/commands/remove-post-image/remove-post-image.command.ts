import { Command } from '@nestjs/cqrs';
import { AppAbility } from '@socialbook/shared';

export class RemovePostImageCommand extends Command<{ imageUrls: string[] }> {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
    public readonly ability: AppAbility,
    public readonly imageUrl: string,
  ) {
    super();
  }
}
