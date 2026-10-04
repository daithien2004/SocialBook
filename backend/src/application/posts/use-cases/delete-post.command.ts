import { Command } from '@nestjs/cqrs';
import { AppAbility } from '@socialbook/shared';

export class DeletePostCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
    public readonly ability: AppAbility,
    public readonly isHardDelete: boolean = false,
  ) {
    super();}
}
