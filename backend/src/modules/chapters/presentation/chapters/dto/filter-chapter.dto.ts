import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class FilterChapterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsMongoId({ message: 'Book ID khÃ´ng há»£p lá»‡' })
  bookId?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}
