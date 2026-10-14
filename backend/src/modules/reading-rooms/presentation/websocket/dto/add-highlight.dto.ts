import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';
import {
  CHAPTER_SLUG_MAX_LENGTH,
  HIGHLIGHT_CONTENT_MAX_LENGTH,
  HIGHLIGHT_CONTENT_MIN_LENGTH,
  PARAGRAPH_ID_MAX_LENGTH,
  ROOM_ID_PATTERN,
} from '../reading-room.constants';

export class AddHighlightDto {
  /**
   * Xem DEC-01 trong docs/reading-room-hardening/DECISIONS.md.
   */
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Invalid value.' })
  roomId!: string;

  @IsString()
  @Length(1, CHAPTER_SLUG_MAX_LENGTH)
  chapterSlug!: string;

  @IsString()
  @Length(1, PARAGRAPH_ID_MAX_LENGTH)
  paragraphId!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(HIGHLIGHT_CONTENT_MIN_LENGTH, HIGHLIGHT_CONTENT_MAX_LENGTH)
  content!: string;
}
