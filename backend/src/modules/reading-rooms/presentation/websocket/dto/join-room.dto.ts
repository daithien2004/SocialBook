import { IsString, Matches } from 'class-validator';
import { ROOM_ID_PATTERN } from '../reading-room.constants';

export class JoinRoomDto {
  /** Mã phòng là chuỗi ngắn do domain sinh, không phải entity UUID. */
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomCode!: string;
}
