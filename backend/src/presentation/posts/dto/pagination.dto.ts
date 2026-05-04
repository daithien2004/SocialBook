import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { Type } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class PaginationUserDto extends PaginationQueryDto {
  @IsNotEmpty({ message: 'userId is required' })
  @IsString()
  @IsMongoId()
  @Type(() => Types.ObjectId)
  userId!: string;
}
