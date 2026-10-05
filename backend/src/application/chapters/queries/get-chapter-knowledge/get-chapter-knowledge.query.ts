import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IChapterKnowledgeRepository } from "@/domain/chapters/repositories/chapter-knowledge.repository.interface";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { IAIPort } from "@/domain/ai/interfaces/ai.port";
import { ChapterKnowledge, KnowledgeEntityType } from "@/domain/chapters/entities/chapter-knowledge.entity";
import { ChapterId } from "@/domain/chapters/value-objects/chapter-id.vo";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";

export class GetChapterKnowledgeQuery extends Query<ChapterKnowledge> {
  constructor(
    public readonly chapterId: string,
    public readonly force: boolean = false,
  ) { super(); }
}
