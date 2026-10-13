import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  MAX_OFFSET_PAGE_LIMIT,
  OffsetPaginationQueryDto,
} from './offset-pagination-query.dto';

export const MAX_LIMIT = MAX_OFFSET_PAGE_LIMIT;

export class PaginationQueryDto extends OffsetPaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Con trỏ trang kế tiếp (pagination dạng cursor)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
