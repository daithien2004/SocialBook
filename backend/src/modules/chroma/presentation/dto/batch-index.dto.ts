import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { BatchIndexCommand } from '@/modules/chroma/application/commands/batch-index/batch-index.command';

export class BatchIndexDto {
  @IsArray()
  @IsString({ each: true })
  contentIds!: string[];

  @IsEnum(['book', 'author', 'chapter'])
  contentType!: 'book' | 'author' | 'chapter';

  @IsOptional()
  forceReindex?: boolean;

  toCommand(actor: Actor): BatchIndexCommand {
    return new BatchIndexCommand(
      actor,
      this.contentIds,
      this.contentType,
      this.forceReindex,
    );
  }
}
