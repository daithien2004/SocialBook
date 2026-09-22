import { AppAbility } from '@socialbook/shared';

export class UpdateCommentCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
    public readonly content: string,
  ) {}
}
