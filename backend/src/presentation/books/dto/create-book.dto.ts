import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateBookDto {
  @IsNotEmpty({ message: 'Tiêu đề sách là bắt buộc' })
  @Length(5, 200, { message: 'Tiêu đề phải từ 5 đến 200 ký tự' })
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsNotEmpty({ message: 'Tác giả là bắt buộc' })
  @IsString({ message: 'Author ID phải là chuỗi ký tự' })
  authorId: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @Transform(({ value }: { value: unknown }) => {
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') return [value];
    return [];
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 thể loại' })
  @ArrayMaxSize(5, { message: 'Tối đa 5 thể loại' })
  @IsString({ each: true, message: 'Mỗi genres ID phải là chuỗi ký tự hợp lệ' })
  genres: string[];

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
