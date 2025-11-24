// src/books/dto/create-book.dto.ts
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateBookDto {
  @IsNotEmpty({ message: 'Tiêu đề sách là bắt buộc' })
  @Length(5, 200, { message: 'Tiêu đề phải từ 5 đến 200 ký tự' })
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsNotEmpty({ message: 'Tác giả là bắt buộc' })
  @IsMongoId({ message: 'Author ID không hợp lệ' })
  authorId: Types.ObjectId;

  // ✅ Transform string/array thành array
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 thể loại' })
  @ArrayMaxSize(5, { message: 'Tối đa 5 thể loại' })
  @IsMongoId({ each: true, message: 'Mỗi genres ID phải là MongoId hợp lệ' })
  genres: Types.ObjectId[];

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

  // ✅ Transform string/array thành array
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Nếu có dấu phẩy, split thành array
      return value.includes(',') ? value.split(',').map(s => s.trim()) : [value];
    }
    return [];
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}