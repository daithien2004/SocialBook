import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Action, Subject, AppAbility } from '@socialbook/shared';
import { subject } from '@casl/ability';

@Injectable()
export class DeleteCollectionUseCase {
  constructor(private readonly collectionRepository: ICollectionRepository) {}

  async execute(id: string, userId: string, ability: AppAbility): Promise<void> {
    const collection = await this.collectionRepository.findById(id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (!ability.can(Action.Delete, subject(Subject.Collection, { userId: collection.userId.getValue() }))) {
      throw new ForbiddenException(
        'You do not have permission to delete this collection',
      );
    }

    await this.collectionRepository.delete(id);
  }
}
