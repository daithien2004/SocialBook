import { IsString, Matches } from 'class-validator';
import {
  HIGHLIGHT_ID_PATTERN,
  OBJECT_ID_PATTERN,
} from '../reading-room.constants';

export class RemoveHighlightDto {
  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId: string;

  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'Highlight không hợp lệ' })
  highlightId: string;
}
