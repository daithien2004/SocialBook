import { Command } from '@nestjs/cqrs';
import { AppAbility } from '@socialbook/shared';
import { ICollectionRepository } from "@/domain/library/repositories/collection.repository.interface";
import { Collection } from "@/domain/library/entities/collection.entity";

export class UpdateCollectionCommand extends Command<Collection> {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
    public readonly name?: string,
    public readonly description?: string,
    public readonly isPublic?: boolean,
  ) { super(); }
}
