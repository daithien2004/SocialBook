import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChapterKnowledge } from '@/modules/chapters/domain/chapters/entities/chapter-knowledge.entity';

class KnowledgeEntityResponseDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  importance!: number;
}

class KnowledgeRelationshipResponseDto {
  @ApiProperty()
  source!: string;

  @ApiProperty()
  target!: string;

  @ApiProperty()
  type!: string;

  @ApiPropertyOptional()
  description?: string;
}

export class ChapterKnowledgeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  chapterId: string;

  @ApiProperty({ type: KnowledgeEntityResponseDto, isArray: true })
  entities: KnowledgeEntityResponseDto[];

  @ApiProperty({ type: KnowledgeRelationshipResponseDto, isArray: true })
  relationships: KnowledgeRelationshipResponseDto[];

  @ApiPropertyOptional()
  summary?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
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
