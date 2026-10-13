import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUUID('4')
  bookId?: string;

  @IsOptional()
  imageUrls?: string[];
}
