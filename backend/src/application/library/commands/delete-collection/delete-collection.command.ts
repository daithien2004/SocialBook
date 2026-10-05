import { Command } from '@nestjs/cqrs';
import { AppAbility } from '@socialbook/shared';

export class DeleteCollectionCommand extends Command<void> {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
  ) {
    super();
  }
}
