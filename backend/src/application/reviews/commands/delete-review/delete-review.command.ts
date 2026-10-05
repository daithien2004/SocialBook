import { Command } from '@nestjs/cqrs';
import type { AppAbility } from '@socialbook/shared';

export class DeleteReviewCommand extends Command<void> {
  constructor(
    public readonly id: string,
    public readonly ability: AppAbility,
  ) {
    super();
  }
}
