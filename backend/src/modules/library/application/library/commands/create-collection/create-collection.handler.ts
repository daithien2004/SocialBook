import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Collection } from '@/modules/library/domain/library/entities/collection.entity';
import { ICollectionRepository } from '@/modules/library/domain/library/repositories/collection.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { ConflictException } from '@nestjs/common';
import { CreateCollectionCommand } from './create-collection.command';

export interface CollectionResult {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

@CommandHandler(CreateCollectionCommand)
export class CreateCollectionHandler implements ICommandHandler<
  CreateCollectionCommand,
  Collection
> {
  constructor(
    private readonly collectionRepository: ICollectionRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: CreateCollectionCommand): Promise<Collection> {
    const existing = await this.collectionRepository.findByUserIdAndName(
      command.userId,
      command.name,
    );

    if (existing) {
      throw new ConflictException('Tên bộ sưu tập này đã tồn tại');
    }

    const collection = Collection.create({
      id: this.idGenerator.generate(),
      userId: command.userId,
      name: command.name,
      description: command.description || '',
      isPublic: command.isPublic || false,
    });

    await this.collectionRepository.save(collection);

    return collection;
  }
}
