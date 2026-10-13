import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const MAX_OFFSET_PAGE_LIMIT = 100;

export class OffsetPaginationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: MAX_OFFSET_PAGE_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_OFFSET_PAGE_LIMIT)
  limit?: number;

  @ApiPropertyOptional({
    default: 1,
    description: 'Alias for page, used by ProTable',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  current?: number;

  @ApiPropertyOptional({
    default: 10,
    maximum: MAX_OFFSET_PAGE_LIMIT,
    description: 'Alias for limit, used by ProTable',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_OFFSET_PAGE_LIMIT)
  pageSize?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  get actualPage(): number {
    if (this.offset !== undefined) {
      return Math.floor(this.offset / this.actualLimit) + 1;
    }
    return this.page ?? this.current ?? 1;
  }

  get actualLimit(): number {
    return this.limit ?? this.pageSize ?? 10;
  }

  get effectiveOffset(): number {
    if (this.offset !== undefined) return this.offset;
    return ((this.page ?? this.current ?? 1) - 1) * this.actualLimit;
  }
}
