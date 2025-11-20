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
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateBookDto {
  @IsNotEmpty({ message: 'Tiêu đề sách là bắt buộc' })
  @Length(5, 200, { message: 'Tiêu đề phải từ 5 đến 200 ký tự' })
  title: string;

  @IsOptional()
  @IsString()
  slug?: string; // nếu không truyền → tự sinh từ title

  @IsNotEmpty({ message: 'Tác giả là bắt buộc' })
  @IsMongoId({ message: 'Author ID không hợp lệ' })
  authorId: Types.ObjectId;

  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 thể loại' })
  @ArrayMaxSize(5, { message: 'Tối đa 5 thể loại' })
  @IsMongoId({ each: true, message: 'Mỗi genre ID phải là MongoId hợp lệ' })
  genre: Types.ObjectId[];

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
