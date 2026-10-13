import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdateBookDto {
  @IsOptional()
  @Length(5, 200, { message: 'Tiêu đề phải từ 5 đến 200 ký tự' })
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Author ID không hợp lệ' })
  authorId?: string;

  @Transform(({ value }: { value: unknown }) => {
    if (!value || (typeof value === 'string' && value.trim() === ''))
      return undefined;
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') return [value.trim()];
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 thể loại' })
  @ArrayMaxSize(5, { message: 'Tối đa 5 thể loại' })
  @IsUUID('4', { each: true, message: 'Mỗi genre ID phải là UUID hợp lệ' })
  genres?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  publishedYear?: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'completed'], {
    message: 'Status phải là draft, published hoặc completed',
  })
  status?: 'draft' | 'published' | 'completed';

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
  @IsString()
  coverUrl?: string;
}
