import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChapterKnowledgeResult } from '@/modules/chapters/application/chapters/commands/generate-chapter-knowledge/generate-chapter-knowledge.result';

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

  constructor(result: ChapterKnowledgeResult) {
    this.id = result.id;
    this.chapterId = result.chapterId;
    this.entities = result.entities.map((e) => ({
      name: e.name,
      type: e.type,
      description: e.description,
      importance: e.importance,
    }));
    this.relationships = result.relationships.map((r) => ({
      source: r.source,
      target: r.target,
      type: r.type,
      description: r.description,
    }));
    this.summary = result.summary;
    this.createdAt = result.createdAt;
    this.updatedAt = result.updatedAt;
  }

  static fromResult(
    result: ChapterKnowledgeResult,
  ): ChapterKnowledgeResponseDto {
    return new ChapterKnowledgeResponseDto(result);
  }
}
