import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsMongoId, IsNumber } from 'class-validator';

export class FilterChapterDto {
  @ApiProperty({ example: 'Chapter 1', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: '64a7f...', required: false })
  @IsOptional()
  @IsMongoId({ message: 'Book ID không hợp lệ' })
  bookId?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiProperty({ example: 1000, required: false })
  @IsOptional()
  @IsNumber()
  minWordCount?: number;

  @ApiProperty({ example: 5000, required: false })
  @IsOptional()
  @IsNumber()
  maxWordCount?: number;
}
