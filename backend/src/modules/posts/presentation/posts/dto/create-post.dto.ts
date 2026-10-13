import { IsBoolean, IsUUID, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsUUID('4')
  bookId!: string;

  @IsString()
  content!: string;

  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;
}
