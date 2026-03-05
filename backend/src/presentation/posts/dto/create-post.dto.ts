import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString
} from 'class-validator';

export class CreatePostDto {
  @IsMongoId()
  bookId: string;

  @IsString()
  content: string;

  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;
}
