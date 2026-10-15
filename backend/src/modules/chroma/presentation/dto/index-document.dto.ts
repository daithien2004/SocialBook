import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { IndexDocumentCommand } from '@/modules/chroma/application/commands/index-document/index-document.command';

export class IndexDocumentDto {
  @IsString()
  @IsNotEmpty()
  contentId!: string;

  @IsEnum(['book', 'author', 'chapter'])
  contentType!: 'book' | 'author' | 'chapter';

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsArray()
  @IsNumber({}, { each: true })
  embedding!: number[];

  toCommand(actor: Actor): IndexDocumentCommand {
    return new IndexDocumentCommand(
      actor,
      this.contentId,
      this.contentType,
      this.content,
      this.metadata,
      this.embedding,
    );
  }
}
