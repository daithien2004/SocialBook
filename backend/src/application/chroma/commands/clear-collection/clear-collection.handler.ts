import { ClearCollectionCommand } from './clear-collection.command';
import { CommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';

@CommandHandler(ClearCollectionCommand)
export class ClearCollectionHandler {
  private readonly logger = new Logger(ClearCollectionHandler.name);

  constructor(private readonly vectorRepository: IVectorRepository) {}

  async execute() {
    try {
      this.logger.log('Clearing vector collection...');

      await this.vectorRepository.clearCollection();

      this.logger.log('Vector collection cleared successfully');

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to clear vector collection', error);
      throw error;
    }
  }
}
