import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FilterUserDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isBanned?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;
}

