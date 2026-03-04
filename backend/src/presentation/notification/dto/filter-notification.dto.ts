import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class FilterNotificationDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;
}

