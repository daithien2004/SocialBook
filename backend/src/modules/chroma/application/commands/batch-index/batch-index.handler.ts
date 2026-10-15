import { BatchIndexCommand } from './batch-index.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { IVectorRepository } from '@/modules/chroma/domain/repositories/vector.repository.interface';
import { ForbiddenError } from '@casl/ability';
import type { BatchIndexResult } from '@/modules/chroma/application/chroma.result';

@CommandHandler(BatchIndexCommand)
export class BatchIndexHandler implements ICommandHandler<BatchIndexCommand> {
  private readonly logger = new Logger(BatchIndexHandler.name);

  constructor(private readonly vectorRepository: IVectorRepository) {}

  async execute(command: BatchIndexCommand): Promise<BatchIndexResult> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'Search',
    );
    try {
      this.logger.log(
        `Starting batch index for ${command.contentIds.length} ${command.contentType}s`,
      );

      // Use the appropriate repository method based on content type
      const result: BatchIndexResult = await (async () => {
        switch (command.contentType) {
          case 'book':
            return this.vectorRepository.indexBooks(command.contentIds);
          case 'author':
            return this.vectorRepository.indexAuthors(command.contentIds);
          case 'chapter':
            return this.vectorRepository.indexChapters(command.contentIds);
          default:
            throw new BadRequestDomainException(
              `Unsupported content type: ${String(command.contentType)}`,
            );
        }
      })();

      this.logger.log(
        `Batch index completed: ${result.successful}/${result.totalProcessed} successful`,
      );

      return {
        totalProcessed: result.totalProcessed,
        successful: result.successful,
        failed: result.failed,
        errors: result.errors,
      };
    } catch (error) {
      this.logger.error(
        `Batch index failed for ${command.contentType}s`,
        error,
      );
      throw error;
    }
  }
}
