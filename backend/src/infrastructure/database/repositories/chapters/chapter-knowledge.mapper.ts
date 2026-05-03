import { ChapterKnowledge as ChapterKnowledgeEntity, KnowledgeEntityType } from '@/domain/chapters/entities/chapter-knowledge.entity';
import { ChapterKnowledgeDocument } from '../../schemas/chapter-knowledge.schema';

export class ChapterKnowledgeMapper {
  static toDomain(document: ChapterKnowledgeDocument): ChapterKnowledgeEntity {
    return ChapterKnowledgeEntity.reconstitute({
      id: document._id,
      chapterId: document.chapterId,
      entities: document.entities.map(e => ({
        name: e.name,
        type: e.type as KnowledgeEntityType,
        description: e.description,
        importance: e.importance,
      })),

      relationships: document.relationships?.map(r => ({
        source: r.source,
        target: r.target,
        type: r.type,
        description: r.description,
      })) || [],
      summary: document.summary,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }


  static toPersistence(entity: ChapterKnowledgeEntity) {
    return {
      _id: entity.id,
      chapterId: entity.chapterId,
      entities: entity.entities.map(e => ({
        name: e.name,
        type: e.type,
        description: e.description,
        importance: e.importance,
      })),
      relationships: entity.relationships.map(r => ({
        source: r.source,
        target: r.target,
        type: r.type,
        description: r.description,
      })),
      summary: entity.summary,
    };
  }


}
