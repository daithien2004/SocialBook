import { randomInt } from 'crypto';
import { Identifier } from '@/shared/domain/identifier.base';
import { ReadingRoomInvalidError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export class RoomId extends Identifier {
  private constructor(id: string) {
    super(id);
  }

  static create(value?: string): RoomId {
    if (value) {
      const sanitized = value.trim().toUpperCase();
      if (!this.isValid(sanitized)) {
        throw new ReadingRoomInvalidError(
          'Mã phòng không hợp lệ. Phải gồm 6 đến 10 ký tự chữ hoặc số.',
        );
      }
      return new RoomId(sanitized);
    }
    return new RoomId(this.generate(8));
  }

  static isValid(value: string): boolean {
    return /^[A-Z0-9]{6,10}$/.test(value);
  }

  private static generate(len = 8): string {
    let s = '';
    for (let i = 0; i < len; i++) {
      s += ALPHABET[randomInt(ALPHABET.length)];
    }
    return s;
  }
}
