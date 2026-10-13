import { IsEnum, IsInt, IsUUID, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomRequestDto {
  @ApiProperty({ description: 'Book ID (UUID string)' })
  @IsUUID('4')
  bookId!: string;

  @ApiProperty({ description: 'Chapter ID (UUID string)' })
  @IsUUID('4')
  chapterId!: string;

  @IsEnum(['sync', 'free'])
  @ApiProperty({ enum: ['sync', 'free'] })
  mode!: 'sync' | 'free';

  @IsInt()
  @Min(2)
  @Max(50)
  @IsOptional()
  maxMembers?: number;
}
