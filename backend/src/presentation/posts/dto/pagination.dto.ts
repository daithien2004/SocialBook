import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { Type } from 'class-transformer';
import { IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class PaginationUserDto extends PaginationQueryDto {
  @IsOptional()
  @IsMongoId()
  @Type(() => Types.ObjectId)
  userId?: string;
}

