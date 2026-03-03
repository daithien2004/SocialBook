import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsMongoId()
  bookId?: string;

  @IsOptional()
  imageUrls?: string[];
}
