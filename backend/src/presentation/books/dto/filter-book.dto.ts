import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class FilterBookDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString({ message: 'Author ID không hợp lệ' })
  authorId?: string;

  @Transform(({ value }) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.includes(',') ? value.split(',').map(s => s.trim()) : [value.trim()];
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Mỗi genre phải là một chuỗi (ID hoặc slug)' })
  genres?: string[];

  @Transform(({ value }) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.includes(',') ? value.split(',').map(s => s.trim()) : [value.trim()];
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['draft', 'published', 'completed'], {
    message: 'Status phải là draft, published hoặc completed',
  })
  status?: 'draft' | 'published' | 'completed';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  publishedYear?: string;
}
