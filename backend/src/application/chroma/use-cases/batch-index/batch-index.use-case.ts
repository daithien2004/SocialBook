import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';
import { BatchIndexCommand } from './batch-index.command';

@Injectable()
export class BatchIndexUseCase {
  private readonly logger = new Logger(BatchIndexUseCase.name);

  constructor(private readonly vectorRepository: IVectorRepository) {}

  async execute(command: BatchIndexCommand) {
    try {
      this.logger.log(
        `Starting batch index for ${command.contentIds.length} ${command.contentType}s`,
      );

      // Use the appropriate repository method based on content type
      interface BatchResult {
        totalProcessed: number;
        successful: number;
        failed: number;
        errors: Array<{ contentId: string; error: string }>;
      }

      const result: BatchResult = await (async () => {
        switch (command.contentType) {
          case 'book':
            return this.vectorRepository.indexBooks(
              command.contentIds,
            ) as Promise<BatchResult>;
          case 'author':
            return this.vectorRepository.indexAuthors(
              command.contentIds,
            ) as Promise<BatchResult>;
          case 'chapter':
            return this.vectorRepository.indexChapters(
              command.contentIds,
            ) as Promise<BatchResult>;
          default:
            throw new BadRequestException(
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
