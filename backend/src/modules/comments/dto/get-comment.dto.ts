import { IsMongoId, IsInt, Min, IsOptional, ValidateIf, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCommentsDto {
  @IsMongoId()
  targetId: string;

  @IsOptional()
  @ValidateIf((o) => o.parentId !== null)
  @IsMongoId()
  parentId: string | null;

  @IsOptional()
  @IsMongoId()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;
}

export class ResolveParentQueryDto {
  @IsMongoId()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  targetType: string;

  @IsOptional()
  @ValidateIf((o) => o.parentId !== null)
  @IsMongoId()
  parentId: string | null;
}