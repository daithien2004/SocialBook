import { IsMongoId, IsInt, Min, IsOptional, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class GetLevel1CommentsDto {
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
