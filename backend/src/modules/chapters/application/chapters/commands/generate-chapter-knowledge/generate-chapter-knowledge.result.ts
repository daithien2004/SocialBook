import type {
  KnowledgeEntityProps,
  KnowledgeRelationshipProps,
} from '@/modules/chapters/domain/chapters/entities/chapter-knowledge.entity';

export interface ChapterKnowledgeResult {
  id: string;
  chapterId: string;
  entities: KnowledgeEntityProps[];
  relationships: KnowledgeRelationshipProps[];
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}
