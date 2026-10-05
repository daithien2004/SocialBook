import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { ICachePort } from "@/shared/domain/cache.port";
import { Injectable } from "@nestjs/common";

export class RecordChapterViewQuery extends Query<void> {
  constructor(
    public readonly bookSlug: string,
    public readonly chapterSlug: string,
    public readonly userId?: string | null,
    public readonly clientIp?: string | null,
  ) { super(); }
}
