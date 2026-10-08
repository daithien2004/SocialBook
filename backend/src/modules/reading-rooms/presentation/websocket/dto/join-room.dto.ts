import { IsString, Matches } from 'class-validator';
import { ROOM_ID_PATTERN } from '../reading-room.constants';

export class JoinRoomDto {
  /** Mã phòng 6–10 ký tự chữ/ối — KHÔNG phải ObjectId (DEC-01). */
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomCode!: string;
}
