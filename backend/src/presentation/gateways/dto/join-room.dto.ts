import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ROOM_CODE_PATTERN } from '../reading-room.constants';

export class JoinRoomDto {
  @IsString()
  @Matches(ROOM_CODE_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomCode: string;

  /**
   * Client cũ có thể gửi kèm; server lấy displayName/avatarUrl từ JWT
   * — giữ hành vi bỏ qua giá trị nhận được (plan T1.5).
   */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
