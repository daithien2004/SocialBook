import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import {
  CHAPTER_SLUG_MAX_LENGTH,
  OBJECT_ID_PATTERN,
} from '../reading-room.constants';

export class ChapterChangeDto {
  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId: string;

  @IsString()
  @Length(1, CHAPTER_SLUG_MAX_LENGTH)
  chapterSlug: string;

  /**
   * Client cũ vẫn gửi 2 field này (useReadingRoomSocket.changeChapter) nhưng
   * server không dùng — chấp nhận và bỏ qua (DEC-04).
   */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  bookId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  chapterId?: string;
}
