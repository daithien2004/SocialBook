import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CHAPTER_SLUG_MAX_LENGTH,
  UUID_PATTERN,
  PARAGRAPH_ID_MAX_LENGTH,
  PROGRESS_MAX,
  PROGRESS_MIN,
  ROOM_ID_PATTERN,
} from '../reading-room.constants';

export class HeartbeatDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Invalid value.' })
  roomId!: string;

  @IsString()
  @Length(1, CHAPTER_SLUG_MAX_LENGTH)
  chapterSlug!: string;

  @IsOptional()
  @IsString()
  @Matches(UUID_PATTERN, { message: 'Invalid value.' })
  chapterId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(PARAGRAPH_ID_MAX_LENGTH)
  paragraphId?: string | null;

  /**
   *
   * `progress` (client g?i `progress` ki?u `number | undefined`) s? b? ch?n oan.
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') return Number(value);
    return undefined;
  })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(PROGRESS_MIN)
  @Max(PROGRESS_MAX)
  progress?: number;
}
