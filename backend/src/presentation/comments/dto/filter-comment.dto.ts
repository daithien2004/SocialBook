import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TargetTypeEnum } from './create-comment.dto';

export class FilterCommentDto extends PaginationQueryDto {
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsEnum(TargetTypeEnum)
  targetType?: TargetTypeEnum;

  @IsOptional()
  targetId?: string;

  @IsOptional()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isFlagged?: boolean;

  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected'])
  moderationStatus?: 'pending' | 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

import { Type } from 'class-transformer';

export class GetCommentsDto {
  @IsString()
  targetId: string;

  @IsOptional()
  parentId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';
}
