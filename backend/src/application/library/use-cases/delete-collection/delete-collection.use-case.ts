import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class DeleteCollectionUseCase {
  constructor(private readonly collectionRepository: ICollectionRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const collection = await this.collectionRepository.findById(id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId.getValue() !== userId) {
      throw new ForbiddenException('You do not have permission to delete this collection');
    }

    await this.collectionRepository.delete(id);
  }
}
