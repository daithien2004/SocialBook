import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from "@nestjs/common";
import { IVectorRepository } from "@/domain/chroma/repositories/vector.repository.interface";

import { CollectionStats } from '@/domain/chroma/repositories/vector.repository.interface';

export class GetCollectionStatsQuery extends Query<CollectionStats> {
  constructor() { super(); }
}
