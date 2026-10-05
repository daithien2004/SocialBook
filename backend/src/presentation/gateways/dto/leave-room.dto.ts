import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import {
  OBJECT_ID_PATTERN,
  ROOM_ID_MAX_LENGTH,
  ROOM_ID_PATTERN,
} from '../reading-room.constants';

export class LeaveRoomDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId!: string;

  /** `newHostId` là userId ⇒ ObjectId 24 hex. */
  @IsOptional()
  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'Người nhận quyền không hợp lệ' })
  newHostId?: string;

  /**
   * Client gửi kèm khi rời trang (`{ roomId: roomCode, roomCode }`) — khai
   * optional và bỏ qua để không vỡ client cũ (DEC-02).
   */
  @IsOptional()
  @IsString()
  @MaxLength(ROOM_ID_MAX_LENGTH)
  roomCode?: string;
}
