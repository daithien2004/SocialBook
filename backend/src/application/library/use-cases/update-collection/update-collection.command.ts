import { AppAbility } from '@socialbook/shared';

export class UpdateCollectionCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
    public readonly name?: string,
    public readonly description?: string,
    public readonly isPublic?: boolean,
  ) {}
}
