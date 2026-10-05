import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { IVectorRepository } from "@/domain/chroma/repositories/vector.repository.interface";

export class BatchIndexCommand extends Command<{ totalProcessed: number; successful: number; failed: number; errors: { contentId: string; error: string; }[]; }> {
  constructor(
    public readonly contentIds: string[],
    public readonly contentType: string,
    public readonly forceReindex?: boolean,
  ) { super(); }
}
