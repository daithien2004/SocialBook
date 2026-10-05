import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IToxicWordRepository } from "@/domain/content-moderation/repositories/toxic-word.repository.interface";
import { ToxicWord } from "@/domain/content-moderation/entities/toxic-word.entity";

export class GetToxicWordsQuery extends Query<ToxicWord[]> {
  constructor() { super(); }
}
