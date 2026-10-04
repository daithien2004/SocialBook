import { IsEnum, IsString, Matches } from 'class-validator';
import { OBJECT_ID_PATTERN } from '../reading-room.constants';

export class ChangeModeDto {
  @IsString()
  @Matches(OBJECT_ID_PATTERN, { message: 'Mã phòng không hợp lệ' })
  roomId: string;

  @IsEnum(['sync', 'free'])
  mode: 'sync' | 'free';
}
