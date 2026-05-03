import { ChapterKnowledge } from '@/domain/chapters/entities/chapter-knowledge.entity';

export class ChapterKnowledgeResponseDto {
  id: string;
  chapterId: string;
  entities: Array<{
    name: string;
    type: string;
    description: string;
    importance: number;
  }>;
  relationships: Array<{
    source: string;
    target: string;
    type: string;
    description?: string;
  }>;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(entity: ChapterKnowledge) {
    this.id = entity.id;
    this.chapterId = entity.chapterId;
    this.entities = entity.entities.map((e) => ({
      name: e.name,
      type: e.type,
      description: e.description,
      importance: e.importance,
    }));
    this.relationships = entity.relationships.map((r) => ({
      source: r.source,
      target: r.target,
      type: r.type,
      description: r.description,
    }));
    this.summary = entity.summary;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }


  static fromEntity(entity: ChapterKnowledge): ChapterKnowledgeResponseDto {
    return new ChapterKnowledgeResponseDto(entity);
  }
}
