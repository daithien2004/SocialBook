import {
  IsBoolean,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFollowDto {
  @IsUUID('4')
  @IsNotEmpty()
  targetId!: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateFollowDto {
  @IsBoolean()
  @IsNotEmpty()
  status!: boolean;
}

export class FollowStatusDto {
  @IsUUID('4')
  @IsNotEmpty()
  userId!: string;

  @IsUUID('4')
  @IsNotEmpty()
  targetId!: string;
}

export class FollowStatsDto {
  @IsUUID('4')
  @IsNotEmpty()
  userId!: string;
}

import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';

export class FilterFollowDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsOptional()
  @IsUUID('4')
  targetId?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
