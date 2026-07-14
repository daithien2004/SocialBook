import { IsString, IsOptional, MaxLength } from 'class-validator';

export class AddCommentDto {
  @IsString()
  roomId: string;

  @IsString()
  chapterSlug: string;

  @IsString()
  paragraphId: string;

  @IsString()
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsString()
  parentCommentId?: string;
}
