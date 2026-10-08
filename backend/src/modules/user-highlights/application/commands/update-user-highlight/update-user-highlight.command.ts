import { Command } from '@nestjs/cqrs';
import type { AppAbility } from '@socialbook/shared';
import { UserHighlight } from '@/modules/user-highlights/domain/entities/user-highlight.entity';

export class UpdateUserHighlightCommand extends Command<UserHighlight> {
  constructor(
    public readonly highlightId: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
    public readonly color?: string,
    public readonly note?: string,
  ) {
    super();
  }
}
