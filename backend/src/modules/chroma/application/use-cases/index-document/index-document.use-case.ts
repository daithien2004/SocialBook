import { Injectable, Logger } from '@nestjs/common';
import { IVectorRepository } from '../../../domain/repositories/vector.repository.interface';
import { VectorDocument } from '../../../domain/entities/vector-document.entity';
import { IndexDocumentCommand } from './index-document.command';

@Injectable()
export class IndexDocumentUseCase {
    private readonly logger = new Logger(IndexDocumentUseCase.name);

    constructor(
        private readonly vectorRepository: IVectorRepository
    ) {}

    async execute(command: IndexDocumentCommand): Promise<{ success: boolean; documentId?: string; error?: string }> {
        try {
            // Check if document already exists
            const existingDocuments = await this.vectorRepository.findByContentId(
                command.contentId, 
                undefined // Check all content types
            );

            if (existingDocuments.length > 0) {
                // Remove existing documents
                for (const existingDoc of existingDocuments) {
                    await this.vectorRepository.deleteById(existingDoc.id);
                }
            }

            // Create new vector document
            const document = VectorDocument.create({
                contentId: command.contentId,
                contentType: command.contentType,
                content: command.content,
                metadata: command.metadata,
                embedding: command.embedding || []
            });

            // Save to vector store
            await this.vectorRepository.save(document);

            this.logger.log(`Successfully indexed document: ${command.contentId} (${command.contentType})`);

            return {
                success: true,
                documentId: document.id.toString()
            };
        } catch (error) {
            this.logger.error(`Failed to index document: ${command.contentId}`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
