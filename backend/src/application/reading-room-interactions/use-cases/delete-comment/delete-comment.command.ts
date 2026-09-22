import { AppAbility } from '@socialbook/shared';

export class DeleteCommentCommand {
  constructor(
    public readonly userId: string,
    public readonly commentId: string,
    public readonly roomId: string,
    public readonly paragraphId: string,
    public readonly ability: AppAbility,
  ) {}
}
