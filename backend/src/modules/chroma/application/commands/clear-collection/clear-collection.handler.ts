import { ClearCollectionCommand } from './clear-collection.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IVectorRepository } from '@/modules/chroma/domain/repositories/vector.repository.interface';
import { ForbiddenError } from '@casl/ability';

@CommandHandler(ClearCollectionCommand)
export class ClearCollectionHandler implements ICommandHandler<ClearCollectionCommand> {
  private readonly logger = new Logger(ClearCollectionHandler.name);

  constructor(private readonly vectorRepository: IVectorRepository) {}

  async execute(
    command: ClearCollectionCommand,
  ): Promise<{ success: boolean }> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'delete',
      'Search',
    );
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
