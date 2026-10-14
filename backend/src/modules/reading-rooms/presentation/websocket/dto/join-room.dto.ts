import { IsString, Matches } from 'class-validator';
import { ROOM_ID_PATTERN } from '../reading-room.constants';

export class JoinRoomDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Invalid value.' })
  roomCode!: string;
}
