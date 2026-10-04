import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import {
  CHAPTER_SLUG_MAX_LENGTH,
  CLIENT_MUTATION_ID_PATTERN,
  HIGHLIGHT_CONTENT_MAX_LENGTH,
  HIGHLIGHT_CONTENT_MIN_LENGTH,
  PARAGRAPH_ID_MAX_LENGTH,
  OBJECT_ID_PATTERN,
} from '../reading-room.constants';

export class AddHighlightDto {
  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId: string;

  @IsString()
  @Length(1, CHAPTER_SLUG_MAX_LENGTH)
  chapterSlug: string;

  @IsString()
  @Length(1, PARAGRAPH_ID_MAX_LENGTH)
  paragraphId: string;

  /** Trim trước khi validate — domain cũng trim lần nữa (entity:231). */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(HIGHLIGHT_CONTENT_MIN_LENGTH, HIGHLIGHT_CONTENT_MAX_LENGTH)
  content: string;

  /** Idempotency key do client cấp (T16) — tùy chọn. */
  @IsOptional()
  @IsString()
  @Matches(CLIENT_MUTATION_ID_PATTERN, {
    message: 'clientMutationId không hợp lệ',
  })
  clientMutationId?: string;
}
