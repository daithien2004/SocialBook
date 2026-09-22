import { AppAbility } from '@socialbook/shared';

export class DeleteCommentCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
  ) {}
}
