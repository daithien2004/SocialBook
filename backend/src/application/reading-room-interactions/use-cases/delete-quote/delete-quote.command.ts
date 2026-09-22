import { AppAbility } from '@socialbook/shared';

export class DeleteQuoteCommand {
  constructor(
    public readonly userId: string,
    public readonly roomCode: string,
    public readonly quoteId: string,
    public readonly ability: AppAbility,
  ) {}
}
