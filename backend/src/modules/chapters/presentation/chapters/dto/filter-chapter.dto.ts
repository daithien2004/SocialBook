import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { IsUUID, IsNumber, IsOptional, IsString } from 'class-validator';

export class FilterChapterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Book ID không hợp lệ' })
  bookId?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}
