import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  KnowledgeGraphLinkResult,
  KnowledgeGraphNodeResult,
  KnowledgeGraphResult,
} from '@/modules/library/application/library/knowledge-graph.result';

export class KnowledgeGraphNodeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ enum: ['user', 'book', 'genre', 'author', 'tag'] })
  type!: KnowledgeGraphNodeResult['type'];

  @ApiProperty()
  val!: number;

  @ApiPropertyOptional()
  img?: string;

  @ApiPropertyOptional()
  color?: string;

  @ApiPropertyOptional()
  isGap?: boolean;

  @ApiPropertyOptional()
  reason?: string;

  @ApiPropertyOptional()
  slug?: string;

  @ApiPropertyOptional()
  url?: string;

  static fromResult(
    node: KnowledgeGraphNodeResult,
  ): KnowledgeGraphNodeResponseDto {
    const response = new KnowledgeGraphNodeResponseDto();
    response.id = node.id;
    response.label = node.label;
    response.type = node.type;
    response.val = node.val;
    response.img = node.img;
    response.color = node.color;
    response.isGap = node.isGap;
    response.reason = node.reason;
    response.slug = node.slug;
    response.url = node.url;
    return response;
  }
}

export class KnowledgeGraphLinkResponseDto {
  @ApiProperty()
  source!: string;

  @ApiProperty()
  target!: string;

  @ApiProperty({
    enum: ['read', 'belongs_to', 'written_by', 'has_tag', 'semantic'],
  })
  type!: KnowledgeGraphLinkResult['type'];

  static fromResult(
    link: KnowledgeGraphLinkResult,
  ): KnowledgeGraphLinkResponseDto {
    const response = new KnowledgeGraphLinkResponseDto();
    response.source = link.source;
    response.target = link.target;
    response.type = link.type;
    return response;
  }
}

export class KnowledgeGraphResponseDto {
  @ApiProperty({ type: [KnowledgeGraphNodeResponseDto] })
  nodes!: KnowledgeGraphNodeResponseDto[];

  @ApiProperty({ type: [KnowledgeGraphLinkResponseDto] })
  links!: KnowledgeGraphLinkResponseDto[];

  static fromResult(result: KnowledgeGraphResult): KnowledgeGraphResponseDto {
    const response = new KnowledgeGraphResponseDto();
    response.nodes = result.nodes.map((node) =>
      KnowledgeGraphNodeResponseDto.fromResult(node),
    );
    response.links = result.links.map((link) =>
      KnowledgeGraphLinkResponseDto.fromResult(link),
    );
    return response;
  }
}
