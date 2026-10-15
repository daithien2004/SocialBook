import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { Actor } from '@/shared/casl/actor';
import { StartChaptersImportCommand } from '@/modules/chapters/application/chapters/commands/start-chapters-import/start-chapters-import.command';

export class ChapterImportItemDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class StartChaptersImportDto {
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterImportItemDto)
  chapters!: ChapterImportItemDto[];

  toCommand(actor: Actor, idempotencyKey: string): StartChaptersImportCommand {
    return new StartChaptersImportCommand(
      actor,
      idempotencyKey,
      this.bookId,
      this.chapters.map((chapter) => ({
        title: chapter.title,
        content: chapter.content,
      })),
    );
  }
}
