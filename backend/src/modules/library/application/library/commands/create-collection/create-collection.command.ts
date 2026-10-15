import { Command } from '@nestjs/cqrs';
import { Collection } from '@/modules/library/domain/library/entities/collection.entity';
import type { Actor } from '@/shared/casl/actor';

export class CreateCollectionCommand extends Command<Collection> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly isPublic?: boolean,
  ) {
    super();
  }
}
