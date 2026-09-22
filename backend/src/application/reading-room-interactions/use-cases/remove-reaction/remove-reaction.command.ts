import { AppAbility } from '@socialbook/shared';

export class RemoveReactionCommand {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
    public readonly paragraphId: string,
    public readonly reactionType: string,
    public readonly ability: AppAbility,
  ) {}
}
