import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { OBJECT_ID_PATTERN } from '../reading-room.constants';

export class LeaveRoomDto {
  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId: string;

  @IsOptional()
  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'Người nhận quyền không hợp lệ' })
  newHostId?: string;

  /**
   * Client gửi kèm khi rời trang (`{ roomId: roomCode, roomCode }`) —
   * chấp nhận và bỏ qua để không vỡ client cũ.
   */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  roomCode?: string;
}
