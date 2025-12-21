import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { TARGET_TYPES } from '@/src/modules/comments/constants/targetType.constant';

export class CreateCommentDto {
  @IsEnum(TARGET_TYPES)
  targetType: string;

  @IsMongoId()
  targetId: string;

  @IsOptional()
  content: string

  @IsOptional()
  @ValidateIf((o) => o.parentId !== null)
  @IsMongoId()
  parentId: string | null;
}

export class CommentCountDto {
  @IsMongoId()
  targetId: string;

  @IsEnum(TARGET_TYPES)
  targetType: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}