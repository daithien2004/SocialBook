import { IsString, Matches } from 'class-validator';
import { ROOM_ID_PATTERN } from '../reading-room.constants';

export class EndRoomDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId: string;
}
