import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';

export class FilterBookDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString({ message: 'Author ID khÃ´ng há»£p lá»‡' })
  authorId?: string;

  @Transform(({ value }: { value: unknown }) => {
    if (!value || (typeof value === 'string' && value.trim() === ''))
      return undefined;
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      return value.includes(',')
        ? value.split(',').map((s) => s.trim())
        : [value.trim()];
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @IsString({
    each: true,
    message: 'Má»—i genre pháº£i lÃ  má»™t chuá»—i (ID hoáº·c slug)',
  })
  genres?: string[];

  @Transform(({ value }: { value: unknown }) => {
    if (!value || (typeof value === 'string' && value.trim() === ''))
      return undefined;
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      return value.includes(',')
        ? value.split(',').map((s) => s.trim())
        : [value.trim()];
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['draft', 'published', 'completed'], {
    message: 'Status pháº£i lÃ  draft, published hoáº·c completed',
  })
  status?: 'draft' | 'published' | 'completed';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['keyword', 'semantic', 'hybrid'])
  mode?: 'keyword' | 'semantic' | 'hybrid';

  @IsOptional()
  @IsString()
  publishedYear?: string;

  @IsOptional()
  @IsEnum(
    [
      'createdAt',
      'updatedAt',
      'title',
      'views',
      'likes',
      'publishedYear',
      'rating',
      'score',
    ],
    {
      message: 'TrÆ°á»ng sáº¯p xáº¿p khÃ´ng há»£p lá»‡',
    },
  )
  override sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'title'
    | 'views'
    | 'likes'
    | 'publishedYear'
    | 'rating'
    | 'score' = undefined;

  @IsOptional()
  @IsEnum(['asc', 'desc'], {
    message: 'Thá»© tá»± sáº¯p xáº¿p pháº£i lÃ  asc hoáº·c desc',
  })
  override order: 'asc' | 'desc' = 'desc';
}
