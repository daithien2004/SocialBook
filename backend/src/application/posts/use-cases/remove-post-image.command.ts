import { AppAbility } from '@socialbook/shared';

export class RemovePostImageCommand {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
    public readonly ability: AppAbility,
    public readonly imageUrl: string,
  ) {}
}
