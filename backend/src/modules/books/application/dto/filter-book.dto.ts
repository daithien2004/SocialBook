import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

export class FilterBookDto {
  @ApiProperty({ example: 'Great Gatsby', required: false })
  @IsOptional()
  @IsString()
  title?: string;

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
  @IsMongoId({ each: true, message: 'Mỗi genres ID phải là MongoId hợp lệ' })
  genres?: string[];

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

  @ApiProperty({ enum: ['draft', 'published', 'completed'], required: false })
  @IsOptional()
  @IsEnum(['draft', 'published', 'completed'], {
    message: 'Status phải là draft, published hoặc completed',
  })
  status?: 'draft' | 'published' | 'completed';

  @ApiProperty({ example: 'search query', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: '1925', required: false })
  @IsOptional()
  @IsString()
  publishedYear?: string;
}
