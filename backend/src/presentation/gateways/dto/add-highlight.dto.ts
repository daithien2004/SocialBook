import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import {
  CHAPTER_SLUG_MAX_LENGTH,
  CLIENT_MUTATION_ID_PATTERN,
  HIGHLIGHT_CONTENT_MAX_LENGTH,
  HIGHLIGHT_CONTENT_MIN_LENGTH,
  PARAGRAPH_ID_MAX_LENGTH,
  ROOM_ID_PATTERN,
} from '../reading-room.constants';

export class AddHighlightDto {
  /**
   * Mã phòng 6–10 ký tự chữ/ối (`^[A-Za-z0-9]{6,10}$`) — KHÔNG phải ObjectId.
   * Xem DEC-01 trong docs/reading-room-hardening/DECISIONS.md.
   */
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId!: string;

  @IsString()
  @Length(1, CHAPTER_SLUG_MAX_LENGTH)
  chapterSlug!: string;

  @IsString()
  @Length(1, PARAGRAPH_ID_MAX_LENGTH)
  paragraphId!: string;

  /** Trim trước khi validate — domain cũng trim lại nữa (entity:230). */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(HIGHLIGHT_CONTENT_MIN_LENGTH, HIGHLIGHT_CONTENT_MAX_LENGTH)
  content!: string;

  /** Idempotency key do client cấp (T16) — tùy chọn. */
  @IsOptional()
  @IsString()
  @Matches(CLIENT_MUTATION_ID_PATTERN, {
    message: 'clientMutationId không hợp lệ',
  })
  clientMutationId?: string;
}
