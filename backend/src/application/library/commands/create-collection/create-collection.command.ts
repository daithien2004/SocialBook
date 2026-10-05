import { Command } from '@nestjs/cqrs';
import { Collection } from '@/domain/library/entities/collection.entity';

export class CreateCollectionCommand extends Command<Collection> {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly isPublic?: boolean,
  ) {
    super();
  }
}
