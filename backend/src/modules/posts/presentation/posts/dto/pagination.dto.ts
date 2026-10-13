import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

export class PaginationUserDto extends PaginationQueryDto {
  @IsNotEmpty({ message: 'userId is required' })
  @IsString()
  @IsUUID('4')
  userId!: string;
}
