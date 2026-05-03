import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @IsString()
  @IsNotEmpty()
  currentChapterSlug: string;

  @IsEnum(['sync', 'free', 'discussion'])
  @IsNotEmpty()
  mode: 'sync' | 'free' | 'discussion';

  @IsInt()
  @Min(2)
  @Max(20)
  @IsOptional()
  maxMembers?: number;
}
