import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {
  @ApiProperty({ example: 'Updated content', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: '64a7f...', required: false })
  @IsOptional()
  @IsMongoId()
  bookId?: string;

  @ApiProperty({ example: ['https://...'], required: false })
  @IsOptional()
  imageUrls?: string[];
}
