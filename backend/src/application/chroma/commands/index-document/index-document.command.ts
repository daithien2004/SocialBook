import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from "@/common/utils/error.util";
import { Injectable, Logger } from "@nestjs/common";
import { IVectorRepository } from "@/domain/chroma/repositories/vector.repository.interface";
import { VectorDocument } from "@/domain/chroma/entities/vector-document.entity";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";

export class IndexDocumentCommand extends Command<{ success: boolean; documentId?: string; error?: string }> {
  constructor(
    public readonly contentId: string,
    public readonly contentType: string,
    public readonly content: string,
    public readonly metadata?: Record<string, any>,
    public readonly embedding?: number[],
  ) { super(); }
}
