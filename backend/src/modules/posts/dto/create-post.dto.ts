import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: '64a7f...', description: 'Book ID' })
  @IsMongoId()
  bookId: string;

  @ApiProperty({ example: 'This is a great book!', description: 'Post content' })
  @IsString()
  content: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDelete?: boolean;
}
