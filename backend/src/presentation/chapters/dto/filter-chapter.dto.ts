import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class FilterChapterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsMongoId({ message: 'Book ID không hợp lệ' })
  bookId?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

