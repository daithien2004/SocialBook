import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @IsString()
  @IsNotEmpty()
  currentChapterSlug!: string;

  @IsEnum(['sync', 'free'])
  @IsNotEmpty()
  @ApiProperty({ enum: ['sync', 'free'] })
  mode!: 'sync' | 'free';

  @IsInt()
  @Min(2)
  @Max(50)
  @IsOptional()
  maxMembers?: number;
}
