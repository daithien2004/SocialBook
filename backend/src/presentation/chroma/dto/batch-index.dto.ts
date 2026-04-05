import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class BatchIndexDto {
  @IsArray()
  @IsString({ each: true })
  contentIds: string[];

  @IsEnum(['book', 'author', 'chapter'])
  contentType: 'book' | 'author' | 'chapter';

  @IsOptional()
  forceReindex?: boolean;
}
