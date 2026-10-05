import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from "@nestjs/common";
import { IVectorRepository, SearchResult } from "@/domain/chroma/repositories/vector.repository.interface";
import { SearchQuery } from "@/domain/chroma/entities/search-query.entity";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";

export class SearchCommand extends Command<{ query: string; results: SearchResult[]; total: number; }> {
  constructor(
    public readonly query: string,
    public readonly contentType?: string,
    public readonly filters?: Record<string, any>,
    public readonly limit?: number,
    public readonly threshold?: number,
    public readonly embedding?: number[],
  ) { super(); }
}
