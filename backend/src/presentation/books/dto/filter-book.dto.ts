import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class FilterBookDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsMongoId({ message: 'Author ID không hợp lệ' })
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
  @IsMongoId({ each: true, message: 'Mỗi genres ID phải là MongoId hợp lệ' })
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
