import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChapterImportItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class StartChaptersImportDto {
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterImportItemDto)
  chapters: ChapterImportItemDto[];
}
