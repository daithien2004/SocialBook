import { IsString, Matches } from 'class-validator';
import { ROOM_ID_PATTERN, UUID_PATTERN } from '../reading-room.constants';

export class GenerateInsightDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId!: string;

  /** Highlight ID là UUID v4 do domain sinh. */
  @IsString()
  @Matches(UUID_PATTERN, { message: 'Highlight không hợp lệ' })
  highlightId!: string;
}
