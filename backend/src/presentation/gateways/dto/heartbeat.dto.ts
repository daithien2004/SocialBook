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
  IGNORED_FIELD_MAX_LENGTH,
  OBJECT_ID_PATTERN,
  PARAGRAPH_ID_MAX_LENGTH,
  PROGRESS_MAX,
  PROGRESS_MIN,
  ROOM_ID_MAX_LENGTH,
  ROOM_ID_PATTERN,
} from '../reading-room.constants';

export class HeartbeatDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId: string;

  @IsString()
  @Length(1, CHAPTER_SLUG_MAX_LENGTH)
  chapterSlug: string;

  @IsOptional()
  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'chapterId không hợp lệ' })
  chapterId?: string;

  /** Client gửi `null` khi không có đoạn đang đọc — `@IsOptional` bỏ qua null. */
  @IsOptional()
  @IsString()
  @MaxLength(PARAGRAPH_ID_MAX_LENGTH)
  paragraphId?: string | null;

  /**
   * Phần trăm 0–100; handler vẫn clamp thêm (phòng thủ nhiều lớp).
   * Xem DEC-05 về việc client gửi thang 0–1.
   *
   * KHÔNG dùng `@Type(() => Number)`: class-transformer biến `undefined` thành
   * `NaN`, mà `@IsOptional()` chỉ bỏ qua `null`/`undefined` ⇒ heartbeat thiếu
   * `progress` (client gửi `progress` kiểu `number | undefined`) sẽ bị chặn oan.
   * `@Transform` bên dưới vẫn nhận chuỗi số như handler cũ (`Number(body.progress)`).
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

  /**
   * Client hiện gửi kèm 2 field này (`useReadingRoomSocket.sendHeartbeat`) —
   * khai optional và bỏ qua để không vỡ client cũ (DEC-02).
   */
  @IsOptional()
  @IsString()
  @MaxLength(ROOM_ID_MAX_LENGTH)
  roomCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(IGNORED_FIELD_MAX_LENGTH)
  bookId?: string;
}
