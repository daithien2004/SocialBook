import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdateBookDto {
  @ApiProperty({ example: 'The Great Gatsby', required: false })
  @IsOptional()
  @Length(5, 200, { message: 'Tiêu đề phải từ 5 đến 200 ký tự' })
  @IsString()
  title?: string;

  @ApiProperty({ example: 'the-great-gatsby', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: '64a7f...', required: false })
  @IsOptional()
  @IsMongoId({ message: 'Author ID không hợp lệ' })
  authorId?: string;

  @ApiProperty({ example: ['64a7f...'], isArray: true, required: false })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 thể loại' })
  @ArrayMaxSize(5, { message: 'Tối đa 5 thể loại' })
  @IsMongoId({ each: true, message: 'Mỗi genres ID phải là MongoId hợp lệ' })
  genres?: string[];

  @ApiProperty({ example: 'Updated description...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '1925', required: false })
  @IsOptional()
  @IsString()
  publishedYear?: string;

  @ApiProperty({ enum: ['draft', 'published', 'completed'], required: false })
  @IsOptional()
  @IsEnum(['draft', 'published', 'completed'], {
    message: 'Status phải là draft, published hoặc completed',
  })
  status?: 'draft' | 'published' | 'completed';

  @ApiProperty({ example: ['fiction', 'classic'], isArray: true, required: false })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
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
