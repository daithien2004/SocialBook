import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateCollectionCommand } from './update-collection.command';
import { Collection } from '@/domain/library/entities/collection.entity';

@Injectable()
export class UpdateCollectionUseCase {
  constructor(private readonly collectionRepository: ICollectionRepository) {}

  async execute(command: UpdateCollectionCommand): Promise<Collection> {
    const collection = await this.collectionRepository.findById(command.id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId.getValue() !== command.userId) {
      throw new ForbiddenException('You do not have permission to update this collection');
    }

    collection.updateInfo({
      name: command.name,
      description: command.description,
      isPublic: command.isPublic,
    });

    await this.collectionRepository.save(collection);

    return collection;
  }
}
