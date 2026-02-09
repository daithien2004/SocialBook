import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateCollectionDto extends CreateCollectionDto {}
