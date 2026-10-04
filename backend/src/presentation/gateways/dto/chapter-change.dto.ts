import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  CHAPTER_SLUG_MAX_LENGTH,
  IGNORED_FIELD_MAX_LENGTH,
  ROOM_ID_PATTERN,
} from '../reading-room.constants';

export class ChapterChangeDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId: string;

  @IsString()
  @Length(1, CHAPTER_SLUG_MAX_LENGTH)
  chapterSlug: string;

  /**
   * Client vẫn gửi 2 field này (`useReadingRoomSocket.changeChapter`) nhưng
   * server chỉ cần `chapterSlug` — khai optional và bỏ qua giá trị (DEC-02).
   */
  @IsOptional()
  @IsString()
  @MaxLength(IGNORED_FIELD_MAX_LENGTH)
  bookId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(IGNORED_FIELD_MAX_LENGTH)
  chapterId?: string;
}
