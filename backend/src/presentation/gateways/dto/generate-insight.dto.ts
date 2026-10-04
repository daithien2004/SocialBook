import { IsString, Matches } from 'class-validator';
import {
  HIGHLIGHT_ID_PATTERN,
  ROOM_ID_PATTERN,
} from '../reading-room.constants';

export class GenerateInsightDto {
  @IsString()
  @Matches(ROOM_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId: string;

  /** Highlight id là UUID v4 do domain sinh — KHÔNG phải ObjectId (DEC-01). */
  @IsString()
  @Matches(HIGHLIGHT_ID_PATTERN, { message: 'Highlight không hợp lệ' })
  highlightId: string;
}
