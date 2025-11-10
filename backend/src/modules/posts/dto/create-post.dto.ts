import { IsArray, IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsMongoId()
  bookId: string;

  @IsString()
  content: string;

  @IsArray()
  @IsOptional()
  image?: string[];

  @IsBoolean()
  @IsOptional()
  isDelete?: boolean;
}
