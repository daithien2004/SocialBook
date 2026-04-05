import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export enum TargetTypeEnum {
  BOOK = 'book',
  CHAPTER = 'chapter',
  POST = 'post',
  AUTHOR = 'author',
}

export class CreateCommentDto {
  @IsEnum(TargetTypeEnum)
  targetType: TargetTypeEnum;

  @IsString()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @ValidateIf((o) => o.parentId !== null)
  parentId?: string | null;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CommentCountDto {
  @IsString()
  targetId: string;

  @IsEnum(TargetTypeEnum)
  targetType: TargetTypeEnum;

  @IsOptional()
  @ValidateIf((o) => o.parentId !== null)
  parentId?: string | null;
}

export class ModerateCommentDto {
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class FlagCommentDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
