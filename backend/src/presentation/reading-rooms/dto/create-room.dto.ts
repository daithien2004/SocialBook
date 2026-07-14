import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @IsString()
  @IsNotEmpty()
  currentChapterSlug: string;

  @IsEnum(['sync', 'free'])
  @IsNotEmpty()
  mode: 'sync' | 'free';

  @IsInt()
  @Min(2)
  @Max(20)
  @IsOptional()
  maxMembers?: number;
}
