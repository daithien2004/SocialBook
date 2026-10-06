import { IsOptional, IsString, Matches } from 'class-validator';
import {
  OBJECT_ID_PATTERN,
  ROOM_ID_PATTERN,
} from '../reading-room/reading-room.constants';

export class LeaveRoomDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId!: string;

  /** `newHostId` là userId ⇒ ObjectId 24 hex. */
  @IsOptional()
  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'Người nhận quyền không hợp lệ' })
  newHostId?: string;
}
