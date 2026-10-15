import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCollectionCommand } from './delete-collection.command';
import { ICollectionRepository } from '@/modules/library/domain/library/repositories/collection.repository.interface';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { ForbiddenError, subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(DeleteCollectionCommand)
export class DeleteCollectionHandler implements ICommandHandler<
  DeleteCollectionCommand,
  void
> {
  constructor(private readonly collectionRepository: ICollectionRepository) {}

  @Transactional()
  async execute(command: DeleteCollectionCommand): Promise<void> {
    const collection = await this.collectionRepository.findById(command.id);

    if (!collection) {
      throw new NotFoundDomainException('Collection not found');
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'delete',
      subject('LibraryCollection', {
        id: collection.id,
        userId: collection.userId.toString(),
        isPublic: collection.isPublic,
      }),
    );

    await this.collectionRepository.delete(command.id);
  }
}
