import { randomInt } from 'crypto';
import { Identifier } from '@/shared/domain/identifier.base';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 31 ký tự, loại bỏ các ký tự dễ nhầm lẫn: 0, O, 1, I, L

export class RoomId extends Identifier {
  private constructor(id: string) {
    super(id);
  }

  static create(value?: string): RoomId {
    if (value) {
      const sanitized = value.trim().toUpperCase();
      if (!this.isValid(sanitized)) {
        throw new BadRequestDomainException(
          'Mã phòng không hợp lệ. Phải gồm từ 6 đến 10 ký tự chữ hoặc số.',
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
