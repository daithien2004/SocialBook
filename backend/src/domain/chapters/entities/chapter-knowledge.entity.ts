import { Entity } from '@/shared/domain/entity.base';
import { ChapterId } from '../value-objects/chapter-id.vo';

export type KnowledgeEntityType = 'character' | 'location' | 'concept' | 'event' | 'vocabulary' | 'reference';


export interface KnowledgeEntityProps {
  name: string;
  type: KnowledgeEntityType;
  description: string;
  importance: number; // 1-10
}

export interface KnowledgeRelationshipProps {
  source: string;
  target: string;
  type: string;
  description?: string;
}

export interface ChapterKnowledgeProps {
  chapterId: ChapterId;
  entities: KnowledgeEntityProps[];
  relationships: KnowledgeRelationshipProps[];
  summary?: string;
}

export class ChapterKnowledge extends Entity<string> {
  private _props: ChapterKnowledgeProps;

  private constructor(id: string, props: ChapterKnowledgeProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: {
    id: string;
    chapterId: string;
    entities: KnowledgeEntityProps[];
    relationships?: KnowledgeRelationshipProps[];
    summary?: string;
  }): ChapterKnowledge {
    return new ChapterKnowledge(props.id, {
      chapterId: ChapterId.create(props.chapterId),
      entities: props.entities,
      relationships: props.relationships || [],
      summary: props.summary,
    });
  }

  static reconstitute(props: {
    id: string;
    chapterId: string;
    entities: KnowledgeEntityProps[];
    relationships: KnowledgeRelationshipProps[];
    summary?: string;
    createdAt: Date;
    updatedAt: Date;
  }): ChapterKnowledge {
    return new ChapterKnowledge(
      props.id,
      {
        chapterId: ChapterId.create(props.chapterId),
        entities: props.entities,
        relationships: props.relationships || [],
        summary: props.summary,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get chapterId(): string {
    return this._props.chapterId.toString();
  }

  get entities(): KnowledgeEntityProps[] {
    return [...this._props.entities];
  }

  get relationships(): KnowledgeRelationshipProps[] {
    return [...this._props.relationships];
  }

  get summary(): string | undefined {
    return this._props.summary;
  }
}

