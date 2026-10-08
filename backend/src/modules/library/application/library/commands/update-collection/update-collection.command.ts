import { Command } from '@nestjs/cqrs';
import { AppAbility } from '@socialbook/shared';
import { Collection } from '@/modules/library/domain/library/entities/collection.entity';

export class UpdateCollectionCommand extends Command<Collection> {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
    public readonly name?: string,
    public readonly description?: string,
    public readonly isPublic?: boolean,
  ) {
    super();
  }
}
