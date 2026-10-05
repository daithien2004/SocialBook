import { Command } from '@nestjs/cqrs';
import type { AppAbility } from '@socialbook/shared';
export class UpdateUserHighlightCommand extends Command<any> {
  constructor(
    public readonly highlightId: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
    public readonly color?: string,
    public readonly note?: string,
  ) { super(); }
}