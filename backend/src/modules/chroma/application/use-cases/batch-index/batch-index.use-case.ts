import { Injectable, Logger } from '@nestjs/common';
import { IVectorRepository } from '../../../domain/repositories/vector.repository.interface';
import { ContentType } from '../../../domain/value-objects/content-type.vo';
import { BatchIndexCommand } from './batch-index.command';

@Injectable()
export class BatchIndexUseCase {
    private readonly logger = new Logger(BatchIndexUseCase.name);

    constructor(
        private readonly vectorRepository: IVectorRepository
    ) {}

    async execute(command: BatchIndexCommand) {
        try {
            this.logger.log(`Starting batch index for ${command.contentIds.length} ${command.contentType}s`);

            // Use the appropriate repository method based on content type
            let result;
            switch (command.contentType) {
                case 'book':
                    result = await this.vectorRepository.indexBooks(command.contentIds);
                    break;
                case 'author':
                    result = await this.vectorRepository.indexAuthors(command.contentIds);
                    break;
                case 'chapter':
                    result = await this.vectorRepository.indexChapters(command.contentIds);
                    break;
                default:
                    throw new Error(`Unsupported content type: ${command.contentType}`);
            }

            this.logger.log(`Batch index completed: ${result.successful}/${result.totalProcessed} successful`);

            return {
                totalProcessed: result.totalProcessed,
                successful: result.successful,
                failed: result.failed,
                errors: result.errors
            };
        } catch (error) {
            this.logger.error(`Batch index failed for ${command.contentType}s`, error);
            throw error;
        }
    }
}
