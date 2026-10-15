import { IndexDocumentCommand } from './index-document.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import { Logger } from '@nestjs/common';
import { IVectorRepository } from '@/modules/chroma/domain/repositories/vector.repository.interface';
import { VectorDocument } from '@/modules/chroma/domain/entities/vector-document.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { ForbiddenError } from '@casl/ability';
import type { IndexDocumentResult } from '@/modules/chroma/application/chroma.result';

@CommandHandler(IndexDocumentCommand)
export class IndexDocumentHandler implements ICommandHandler<IndexDocumentCommand> {
  private readonly logger = new Logger(IndexDocumentHandler.name);

  constructor(
    private readonly vectorRepository: IVectorRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: IndexDocumentCommand): Promise<IndexDocumentResult> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'Search',
    );
    try {
      // Check if document already exists
      const existingDocuments = await this.vectorRepository.findByContentId(
        command.contentId,
        undefined, // Check all content types
      );

      if (existingDocuments.length > 0) {
        // Remove existing documents
        for (const existingDoc of existingDocuments) {
          await this.vectorRepository.deleteById(existingDoc.id);
        }
      }

      // Create new vector document
      const document = VectorDocument.create({
        id: this.idGenerator.generate(),
        contentId: command.contentId,
        contentType: command.contentType,
        content: command.content,
        metadata: command.metadata,
        embedding: command.embedding || [],
      });

      // Save to vector store
      await this.vectorRepository.save(document);

      this.logger.log(
        `Successfully indexed document: ${command.contentId} (${command.contentType})`,
      );

      return {
        success: true,
        documentId: document.id.toString(),
      };
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Failed to index document: ${command.contentId}`,
        errorMessage,
      );
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
