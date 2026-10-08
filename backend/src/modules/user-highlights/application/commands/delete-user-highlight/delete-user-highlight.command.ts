import { Command } from '@nestjs/cqrs';
import type { AppAbility } from '@socialbook/shared';

export class DeleteUserHighlightCommand extends Command<void> {
  constructor(
    public readonly highlightId: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
  ) {
    super();
  }
}
