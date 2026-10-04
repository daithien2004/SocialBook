import { Command } from '@nestjs/cqrs';
import { AppAbility } from '@socialbook/shared';

export class UpdateCommentCommand extends Command<any> {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
    public readonly content: string,
  ) {
    super();}
}
