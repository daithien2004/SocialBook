import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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

export class CreateBookDto {
  @ApiProperty({ example: 'The Great Gatsby', description: 'Title of the book' })
  @IsNotEmpty({ message: 'Tiêu đề sách là bắt buộc' })
  @Length(5, 200, { message: 'Tiêu đề phải từ 5 đến 200 ký tự' })
  title: string;

  @ApiProperty({ example: 'the-great-gatsby', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: '64a7f...', description: 'Author ID' })
  @IsNotEmpty({ message: 'Tác giả là bắt buộc' })
  @IsMongoId({ message: 'Author ID không hợp lệ' })
  authorId: string;

  @ApiProperty({ example: ['64a7f...'], isArray: true, description: 'List of genre IDs' })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 thể loại' })
  @ArrayMaxSize(5, { message: 'Tối đa 5 thể loại' })
  @IsMongoId({ each: true, message: 'Mỗi genres ID phải là MongoId hợp lệ' })
  genres: string[];

  @ApiProperty({ example: 'Typical description...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '1925', required: false })
  @IsOptional()
  @IsString()
  publishedYear?: string;

  @ApiProperty({ enum: ['draft', 'published', 'completed'], default: 'draft', required: false })
  @IsOptional()
  @IsEnum(['draft', 'published', 'completed'], {
    message: 'Status phải là draft, published hoặc completed',
  })
  status?: 'draft' | 'published' | 'completed';

  @ApiProperty({ example: ['fiction', 'classic'], isArray: true, required: false })
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

  @ApiProperty({ example: 'https://example.com/cover.jpg', required: false })
  @IsOptional()
  @IsString()
  coverUrl?: string;
}
