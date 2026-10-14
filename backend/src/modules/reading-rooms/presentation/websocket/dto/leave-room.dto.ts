import { IsOptional, IsString, Matches } from 'class-validator';
import { UUID_PATTERN, ROOM_ID_PATTERN } from '../reading-room.constants';

export class LeaveRoomDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Invalid value.' })
  roomId!: string;

  @IsOptional()
  @IsString()
  @Matches(UUID_PATTERN, { message: 'Invalid value.' })
  newHostId?: string;
}
