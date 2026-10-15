import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICollectionRepository } from '@/modules/library/domain/library/repositories/collection.repository.interface';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { UpdateCollectionCommand } from './update-collection.command';
import { Collection } from '@/modules/library/domain/library/entities/collection.entity';
import { ForbiddenError, subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(UpdateCollectionCommand)
export class UpdateCollectionHandler implements ICommandHandler<
  UpdateCollectionCommand,
  Collection
> {
  constructor(private readonly collectionRepository: ICollectionRepository) {}

  @Transactional()
  async execute(command: UpdateCollectionCommand): Promise<Collection> {
    const collection = await this.collectionRepository.findById(command.id);

    if (!collection) {
      throw new NotFoundDomainException('Collection not found');
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('LibraryCollection', {
        id: collection.id,
        userId: collection.userId.toString(),
        isPublic: collection.isPublic,
      }),
    );

    collection.updateInfo({
      name: command.name,
      description: command.description,
      isPublic: command.isPublic,
    });

    await this.collectionRepository.save(collection);

    return collection;
  }
}
