import { IsString, Matches } from 'class-validator';
import { ROOM_ID_PATTERN, UUID_PATTERN } from '../reading-room.constants';

export class GenerateInsightDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Invalid value.' })
  roomId!: string;

  @IsString()
  @Matches(UUID_PATTERN, { message: 'Invalid value.' })
  highlightId!: string;
}
