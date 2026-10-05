import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCollectionCommand } from './delete-collection.command';
import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Action, Subject, AppAbility } from '@socialbook/shared';
import { subject } from '@casl/ability';

@CommandHandler(DeleteCollectionCommand)
export class DeleteCollectionHandler implements ICommandHandler<DeleteCollectionCommand, void> {
  constructor(private readonly collectionRepository: ICollectionRepository) {}

  async execute(command: DeleteCollectionCommand): Promise<void> {
    const collection = await this.collectionRepository.findById(command.id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (
      !command.ability.can(
        Action.Delete,
        subject(Subject.Collection, { userId: collection.userId.getValue() }),
      )
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this collection',
      );
    }

    await this.collectionRepository.delete(command.id);
  }
}
