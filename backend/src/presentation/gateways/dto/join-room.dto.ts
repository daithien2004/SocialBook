import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import {
  CLIENT_AVATAR_URL_MAX_LENGTH,
  CLIENT_DISPLAY_NAME_MAX_LENGTH,
  ROOM_ID_PATTERN,
} from '../reading-room.constants';

export class JoinRoomDto {
  /** Mã phòng 6–10 ký tự chữ/ối — KHÔNG phải ObjectId (DEC-01). */
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomCode: string;

  /**
   * Client cũ thường gửi kèm; server lấy displayName/avatarUrl từ JWT và bỏ
   * qua giá trị — giữ nguyên hành vi bỏ qua nhưng khai optional để
   * `forbidNonWhitelisted` không làm vỡ client (DEC-02).
   */
  @IsOptional()
  @IsString()
  @MaxLength(CLIENT_DISPLAY_NAME_MAX_LENGTH)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(CLIENT_AVATAR_URL_MAX_LENGTH)
  avatarUrl?: string;
}
