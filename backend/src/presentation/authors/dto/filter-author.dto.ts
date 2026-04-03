import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { IsOptional, IsString } from 'class-validator';

export class FilterAuthorDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  isActive?: boolean;
}
