import { Command } from '@nestjs/cqrs';
import { Collection } from "@/domain/library/entities/collection.entity";
import { ICollectionRepository } from "@/domain/library/repositories/collection.repository.interface";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";

export class CreateCollectionCommand extends Command<Collection> {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly isPublic?: boolean,
  ) { super(); }
}
