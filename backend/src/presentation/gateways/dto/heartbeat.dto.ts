import { Type } from 'class-transformer';
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
  OBJECT_ID_PATTERN,
  PARAGRAPH_ID_MAX_LENGTH,
  PROGRESS_MAX,
  PROGRESS_MIN,
} from '../reading-room.constants';

export class HeartbeatDto {
  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId: string;

  @IsString()
  @Length(1, CHAPTER_SLUG_MAX_LENGTH)
  chapterSlug: string;

  @IsOptional()
  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'chapterId không hợp lệ' })
  chapterId?: string;

  /** Client gửi `null` khi không có đoạn đang đọc — IsOptional bỏ qua null. */
  @IsOptional()
  @IsString()
  @MaxLength(PARAGRAPH_ID_MAX_LENGTH)
  paragraphId?: string | null;

  /** Phần trăm 0–100; handler vẫn clamp thêm (phòng thủ nhiều lớp). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(PROGRESS_MIN)
  @Max(PROGRESS_MAX)
  progress?: number;

  /**
   * Client hiện gửi kèm 2 field này (useReadingRoomSocket.sendHeartbeat) —
   * chấp nhận và bỏ qua để không vỡ client cũ (DEC-04).
   */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  roomCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  bookId?: string;
}
