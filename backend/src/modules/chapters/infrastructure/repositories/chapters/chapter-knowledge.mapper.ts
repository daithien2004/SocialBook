import { z } from 'zod';
import {
  Prisma,
  ChapterKnowledge as ChapterKnowledgeRow,
} from '@/core/database/generated/prisma/client';
import { ChapterKnowledge as ChapterKnowledgeEntity } from '@/modules/chapters/domain/chapters/entities/chapter-knowledge.entity';

const knowledgeEntitiesSchema = z.array(
  z.object({
    name: z.string(),
    type: z.enum([
      'character',
      'location',
      'concept',
      'event',
      'vocabulary',
      'reference',
    ]),
    description: z.string(),
    importance: z.number(),
  }),
);

const knowledgeRelationshipsSchema = z.array(
  z.object({
    source: z.string(),
    target: z.string(),
    type: z.string(),
    description: z.string().optional(),
  }),
);

export class ChapterKnowledgeMapper {
  static toDomain(row: ChapterKnowledgeRow): ChapterKnowledgeEntity {
    return ChapterKnowledgeEntity.reconstitute({
      id: row.id,
      chapterId: row.chapterId,
      entities: knowledgeEntitiesSchema.parse(row.entities),
      relationships: knowledgeRelationshipsSchema.parse(row.relationships),
      summary: row.summary ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toCreateInput(
    knowledge: ChapterKnowledgeEntity,
  ): Prisma.ChapterKnowledgeUncheckedCreateInput {
    const entities = knowledge.entities.map((entity) => ({
      name: entity.name,
      type: entity.type,
      description: entity.description,
      importance: entity.importance,
    })) satisfies Prisma.InputJsonArray;
    const relationships = knowledge.relationships.map((relationship) => ({
      source: relationship.source,
      target: relationship.target,
      type: relationship.type,
      ...(relationship.description === undefined
        ? {}
        : { description: relationship.description }),
    })) satisfies Prisma.InputJsonArray;

    return {
      id: knowledge.id,
      chapterId: knowledge.chapterId,
      entities,
      relationships,
      summary: knowledge.summary ?? null,
      createdAt: knowledge.createdAt,
      updatedAt: knowledge.updatedAt,
    };
  }
}
