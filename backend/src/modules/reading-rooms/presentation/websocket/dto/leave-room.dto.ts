import { IsOptional, IsString, Matches } from 'class-validator';
import { UUID_PATTERN, ROOM_ID_PATTERN } from '../reading-room.constants';

export class LeaveRoomDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId!: string;

  /** `newHostId` là user ID dạng UUID. */
  @IsOptional()
  @IsString()
  @Matches(UUID_PATTERN, { message: 'Người nhận quyền không hợp lệ' })
  newHostId?: string;
}
