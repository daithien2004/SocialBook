import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsEnum(['book', 'author', 'chapter'])
  contentType?: 'book' | 'author' | 'chapter';

  @IsOptional()
  filters?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  threshold?: number;

  @IsOptional()
  @IsArray()
  embedding?: number[];
}
