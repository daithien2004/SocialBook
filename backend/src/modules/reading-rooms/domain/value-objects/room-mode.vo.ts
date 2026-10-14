import { Identifier } from '@/shared/domain/identifier.base';
import { ReadingRoomInvalidError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';

export type RoomModeType = 'sync' | 'free';

export class RoomMode extends Identifier {
  private readonly _modeType: RoomModeType;

  private constructor(value: RoomModeType) {
    super(value);
    this._modeType = value;
  }

  static create(value: string): RoomMode {
    if (!this.isValid(value)) {
      throw new ReadingRoomInvalidError(
        `Invalid room mode: ${value}. Allowed: sync, free`,
      );
    }
    return new RoomMode(value);
  }

  static isValid(value: string): value is RoomModeType {
    return ['sync', 'free'].includes(value);
  }

  get modeType(): RoomModeType {
    return this._modeType;
  }
}
